# Система учёта посещаемости

> **Full‑stack attendance tracking service — Docker Compose for local dev, Helm for Kubernetes, Prometheus + Grafana for observability.**

---

## 1 — Обзор

Микросервис‑API на **Node.js + Fastify** хранит данные о встречах и посещениях в **MongoDB**, кэширует ответы в **Redis** и экспортирует метрики в формате Prometheus. Чарт **`attendance‑chart`** развёртывает весь стек в Minikube и включает smoke‑тест, выполняемый командой `helm test`.

---

## 2 — Возможности

- JWT аутентификация и RBAC
- CRUD операции над Users / Groups / Meetings / Attendings
- `/hc` — health‑check (401 требует JWT), `/metrics` — открытый Prometheus‑endpoint
- Авто‑seed демонстрационных данных при старте
- Grafana‑дашборды «из коробки»

---

## 3 — Технологический стек

| Слой          | Технологии                                                     |
| ------------- | -------------------------------------------------------------- |
| **API**       | Node 18, TypeScript, Fastify, pino                             |
| **Хранение**  | MongoDB 4.4, Mongoose, Redis 6                                 |
| **Dev tools** | Docker, Docker Compose, ESLint, Prettier                       |
| **Prod**      | Kubernetes 1.30 (Minikube), Helm ≥ 3.10                        |
| **Observ.**   | Prometheus 2.54, Grafana 10, Node‑Exporter, Helm test‑hook     |
| **CI / QA**   | Jest 29, Swagger/OpenAPI                                       |

---

## 4 — Требования

- Docker & Docker Compose  (v2 рекомендуется)
- **Minikube** + **kubectl**
- **Helm 3.10** или выше
- Git, Node.js ≥ 18, curl

---

## 5 — Быстрый старт

### 5.1 Docker Compose

```bash
# 1 — Клонируем репозиторий
 git clone https://github.com/<YOU>/attendance-system.git
 cd attendance-system

# 2 — Поднимаем стек (API + Mongo + Redis + Prom + Grafana)
 docker compose up -d

# 3 — Проверяем, что метрики отдаются
 curl http://localhost:3002/metrics | head
```

### 5.2 Kubernetes (Helm + Minikube)

```bash
# 1 — Запускаем Minikube
minikube start --driver=docker

# 2 — Перенаправляем docker cli во внутр. демон
eval $(minikube docker-env)

# 3 — Собираем образ API внутри кластера
docker build -t attendance-server:local .

# 4 — Возвращаемся к хостовому docker
eval $(minikube docker-env -u)

# 5 — Деплоим Helm‑чарт
helm dependency update ./attendance-chart
helm lint            ./attendance-chart
helm upgrade --install attendance ./attendance-chart

# 6 — Проверяем hook‑тест
helm test attendance --logs
```

#### Быстрые порты

```bash
# API + метрики
kubectl port-forward svc/attendance-attendance-chart 3002:3002 &
# Prometheus UI
kubectl port-forward svc/prometheus 9090:9090 &
# Grafana UI (admin/admin)
kubectl port-forward svc/grafana 3000:3000 &
```

Сервисы будут доступны на:

| Сервис      | URL                       |
| ----------- | ------------------------- |
| API         | <http://localhost:3002>   |
| Метрики     | <http://localhost:3002/metrics> |
| Prometheus  | <http://localhost:9090>   |
| Grafana     | <http://localhost:3000>   |

---

## 6 — Эндпоинты API (TL;DR)

| Ресурс   | Путь                 | Методы            | Комментарий                 |
| -------- | -------------------- | ----------------- | --------------------------- |
| Auth     | `/login`, `/register`| `POST`            | JWT (access + refresh)      |
| Users    | `/users`, `/user/:id`| `GET/PUT/DELETE`  | Управление пользователями   |
| Groups   | `/groups`, `/group/:id` | `GET/POST/PUT/DELETE` | CRUD групп            |
| Meetings | `/meetings`, `/meeting/:id` | …            | Расписание встреч          |
| Attend.  | `/attendings`, `/attending/:id` | …        | Учёт посещаемости          |
| Health   | `/hc` (401)          | `GET`             | Требует JWT                 |
| Metrics  | `/metrics`           | `GET`             | Открытый endpoint Prometheus |

---

## 7 — Helm‑чарт `attendance-chart`

### 7.1 Ключевые значения `values.yaml`

```yaml
replicaCount: 1
image:
  repository: attendance-server
  tag: local           # билдим в Minikube
service:
  port: 3002
env:
  SIRIUS_X_ATTENDANCE_MONGO_HOST: attendance-db.default.svc.cluster.local

# Smoke‑hook
tests:
  enabled: true
  image: curlimages/curl:8.7.1
  timeoutSeconds: 10
```

### 7.2 Шаблоны

- **deployment.yaml**  — один Pod, `ulimit -n 1048576 && npm run up:prod`.
- **service.yaml**     — `ClusterIP:3002`.
- **metrics-test.yaml** — Helm‑hook Job, `curl /metrics | grep '^# HELP'`.
- **NOTES.txt**        — вывод полезных команд.

### 7.3 Полезные команды

```bash
# Роллинг‑рестарт для «чистых» логов
kubectl rollout restart deploy/attendance-attendance-chart

# Удалить временный тестовый pod BusyBox
kubectl delete pod busy --ignore-not-found

# Проверка DNS + портов
kubectl run net-test --rm -it --image=alpine --restart=Never -- \
  sh -c 'apk add -q bind-tools netcat-openbsd && \
         nslookup attendance-db.default.svc.cluster.local && \
         nc -zv attendance-db.default.svc.cluster.local 27017'
```

---

## 8 — Наблюдаемость

1. **Prometheus** собирает метрики со следующих targets:
   - `attendance-attendance-chart:3002/metrics`
   - `node-exporter:9100/metrics`
   - `prometheus:9090/metrics`
2. **Grafana** автоматически подхватывает источник `Prometheus` и дашборд `attendance-system.json`.

> Быстрая проверка: в Prom UI выражение `up{job="attendance-attendance-chart"}` должно вернуть `1`.

---

## 9 — Обоснование инструментов

- **Docker Compose** — zero‑config локальный стек.
- **Minikube** — production‑like среда без облака.
- **Helm** — версионированные релизы, `helm diff` и rollback.
- **Prometheus + Grafana** — де‑факто стандарт мониторинга.
- **curlimages/curl** — минимальный образ для e2e hook‑теста.

### Этапы CI → Prod

1. **Local dev** — Compose: код → тесты → метрики.
2. **CI (build)** — сборка образа, `npm test`, `docker push` (опц.).
3. **Staging** — Minikube / Kind: `helm upgrade --install` (+ `helm test`).
4. **Prod** — Helm Release в cluster, мониторинг alertmanager (не включён).

---

## 10 — Частые проблемы

| Симптом                      | Шаги решения |
| ---------------------------- | ------------ |
| `ImagePullBackOff`           | Соберите образ внутри Minikube: `eval $(minikube docker-env)` → `docker build -t attendance-server:local .` |
| Пробки `/hc` 401             | Liveness/Readiness должны проверять `/metrics`, не `/hc`. |
| `bind: address in use`       | Порт‑форвард уже запущен — убейте процесс или используйте другой локальный порт. |

---

## 11 — Структура репозитория (сокр.)

```
attendance-back/
├─ attendance-chart/       # Helm chart
│  └─ templates/
├─ k8s-manifests/          # raw YAML (optional)
├─ docker-compose.yml
├─ Dockerfile
├─ src/
└─ README.md
```