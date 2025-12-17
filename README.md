# JASCA - Trivy Vulnerability Management System

Trivy 스캔 결과를 중앙에서 수집, 저장, 분석, 추적하여 조직 단위 취약점 관리 체계를 구축하는 플랫폼입니다.

## 🚀 Quick Start

### 사전 요구사항

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- Docker & Docker Compose (선택)

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp apps/api/.env.example apps/api/.env

# 데이터베이스 마이그레이션
cd apps/api
pnpm prisma:migrate

# 시드 데이터 생성
pnpm prisma:seed

# 개발 서버 실행 (루트에서)
cd ../..
pnpm dev
```

### Docker로 실행

```bash
cd docker
docker-compose up -d
```

## 📁 프로젝트 구조

```
jasca/
├── apps/
│   ├── api/                 # NestJS Backend API
│   │   ├── src/
│   │   │   ├── modules/     # Feature modules
│   │   │   │   ├── auth/    # 인증/인가
│   │   │   │   ├── scans/   # 스캔 결과 수집
│   │   │   │   ├── vulnerabilities/  # 취약점 관리
│   │   │   │   ├── policies/# 정책 엔진
│   │   │   │   ├── stats/   # 통계/대시보드
│   │   │   │   └── ...
│   │   │   └── prisma/      # Prisma ORM
│   │   └── prisma/          # DB Schema & Migrations
│   └── web/                 # Next.js Frontend
│       └── src/
│           └── app/         # App Router pages
├── docker/                  # Docker configuration
└── packages/                # Shared packages
```

## 🔑 API Endpoints

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인

### 스캔 결과
- `POST /api/scans/upload` - 스캔 결과 업로드 (Multipart)
- `POST /api/scans/upload/json` - 스캔 결과 업로드 (JSON)
- `GET /api/scans` - 스캔 목록 조회
- `GET /api/scans/:id` - 스캔 상세 조회

### 취약점
- `GET /api/vulnerabilities` - 취약점 목록 (필터링 지원)
- `GET /api/vulnerabilities/:id` - 취약점 상세
- `PUT /api/vulnerabilities/:id/status` - 상태 변경
- `PUT /api/vulnerabilities/:id/assign` - 담당자 지정

### 정책
- `GET /api/policies` - 정책 목록
- `POST /api/policies` - 정책 생성
- `POST /api/policies/evaluate` - 정책 평가 (배포 차단 여부)

### 통계
- `GET /api/stats/overview` - 전체 현황
- `GET /api/stats/trend` - 추세 분석
- `GET /api/stats/by-project` - 프로젝트별 통계

## 🔒 인증

### JWT 인증

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@acme.com", "password": "admin123"}'
```

### API Key 인증 (CI/CD용)

```bash
curl -X POST http://localhost:3001/api/scans/upload \
  -H "X-API-Key: your-api-key" \
  -F "file=@trivy-result.json" \
  -F "sourceType=TRIVY_JSON"
```

## 📊 CI/CD 연동 예시

### GitLab CI

```yaml
security_scan:
  stage: security
  script:
    - trivy image --format json -o result.json $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - |
      curl -X POST "$JASCA_API_URL/scans/upload" \
        -H "X-API-Key: $JASCA_API_KEY" \
        -F "file=@result.json" \
        -F "sourceType=TRIVY_JSON" \
        -F "imageRef=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" \
        -F "commitHash=$CI_COMMIT_SHA" \
        -F "branch=$CI_COMMIT_BRANCH"
```

### GitHub Actions

```yaml
- name: Trivy Scan
  run: trivy image --format json -o result.json $IMAGE_NAME

- name: Upload to JASCA
  run: |
    curl -X POST "${{ secrets.JASCA_API_URL }}/scans/upload" \
      -H "X-API-Key: ${{ secrets.JASCA_API_KEY }}" \
      -F "file=@result.json" \
      -F "sourceType=TRIVY_JSON"
```

## 🧪 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| Admin | admin@acme.com | admin123 |
| Developer | dev@acme.com | dev123 |

## 📄 License

MIT
