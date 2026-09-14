# HelpDesk Pro

> Hệ thống quản lý yêu cầu hỗ trợ (Support Ticket Management System) dành cho project cá nhân xin thực tập Backend/Full-stack.

## 0. Nguồn yêu cầu chuẩn

File này là **nguồn chuẩn duy nhất (single source of truth)** cho yêu cầu sản
phẩm, API, database, vai trò và luồng nghiệp vụ của toàn dự án. Các file
`AGENTS.md` chỉ quy định cách triển khai và kiểm tra code; nếu có khác biệt thì
phải tuân theo `PROJECT_SPEC.md`.

Tên vai trò chuẩn là `USER`, `AGENT`, `ADMIN`. Trong giao diện có thể hiển thị
`USER` là “Khách hàng” và `AGENT` là “Nhân viên hỗ trợ”, nhưng API và database
không sử dụng các enum `CUSTOMER` hoặc `STAFF`.

## 1. Tổng quan

HelpDesk Pro là website giúp khách hàng hoặc nhân viên gửi yêu cầu hỗ trợ dưới dạng **ticket**. Quản trị viên tiếp nhận, phân công ticket cho nhân viên hỗ trợ và theo dõi toàn bộ quá trình xử lý.

Ví dụ một ticket:

```text
Mã: HD-2026-000001
Tiêu đề: Không đăng nhập được hệ thống
Người tạo: Nguyễn Văn A
Danh mục: Tài khoản
Mức độ ưu tiên: HIGH
Trạng thái: IN_PROGRESS
Người xử lý: Trần Văn B
```

## 2. Mục tiêu project

- Xây dựng frontend bằng Next.js và backend REST API bằng NestJS.
- Thực hành authentication, authorization và phân quyền theo vai trò.
- Thiết kế cơ sở dữ liệu PostgreSQL có quan hệ rõ ràng.
- Xử lý nghiệp vụ ticket thay vì chỉ làm CRUD đơn giản.
- Thực hành upload file, thông báo real-time và gửi email.
- Viết tài liệu Swagger, test, Docker và deploy sản phẩm.
- Tạo một sản phẩm hoàn chỉnh để trình bày trong CV và phỏng vấn intern.

## 3. Công nghệ sử dụng

### Frontend

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- TanStack Query
- Axios
- React Hook Form
- Zod
- Socket.IO Client

### Backend

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Passport JWT
- `class-validator`
- Socket.IO
- Swagger
- Jest

### Công cụ

- Docker và Docker Compose
- Git và GitHub
- Postman hoặc Bruno
- Cloudinary (lưu file/ảnh)
- Nodemailer (gửi email, phần nâng cao)

> Redis không bắt buộc trong phiên bản đầu tiên. Chỉ bổ sung sau khi MVP đã hoàn thành.

## 4. Kiến trúc tổng thể

```text
Browser
   |
   v
Next.js Frontend (localhost:3001)
   |
   | REST API / WebSocket
   v
NestJS Backend (localhost:3000)
   |
   v
PostgreSQL
```

### Trách nhiệm của Next.js

- Hiển thị giao diện.
- Nhận dữ liệu từ form.
- Gọi API NestJS.
- Quản lý trạng thái phía client.
- Hiển thị giao diện phù hợp với role.

### Trách nhiệm của NestJS

- Xác thực và phân quyền người dùng.
- Xử lý toàn bộ nghiệp vụ.
- Đọc và ghi dữ liệu PostgreSQL.
- Kiểm tra dữ liệu đầu vào.
- Quản lý ticket, comment, file và notification.
- Cung cấp REST API và WebSocket.

> Không đặt nghiệp vụ chính trong Next.js Route Handlers. NestJS là backend duy nhất của hệ thống.

## 5. Vai trò người dùng

### USER

- Đăng ký và đăng nhập.
- Tạo ticket.
- Xem ticket của chính mình.
- Bình luận trong ticket.
- Đính kèm ảnh hoặc file.
- Xác nhận đóng hoặc mở lại ticket.
- Đánh giá sau khi ticket hoàn thành.

### AGENT

- Xem các ticket được phân công.
- Bắt đầu xử lý ticket.
- Bình luận và trao đổi với User.
- Cập nhật trạng thái ticket.
- Đánh dấu ticket đã được giải quyết.

### ADMIN

- Xem tất cả ticket.
- Phân công ticket cho Agent.
- Quản lý người dùng và Agent.
- Quản lý danh mục ticket.
- Theo dõi ticket quá hạn.
- Xem dashboard thống kê.

## 6. Luồng nghiệp vụ chính

1. User đăng nhập và tạo ticket.
2. Ticket mới có trạng thái `OPEN`.
3. Admin nhận thông báo và phân công một Agent.
4. Ticket chuyển sang `ASSIGNED`.
5. Agent bắt đầu xử lý, ticket chuyển sang `IN_PROGRESS`.
6. User và Agent trao đổi thông qua comment.
7. Agent hoàn thành công việc và chuyển ticket sang `RESOLVED`.
8. User xác nhận kết quả và chuyển ticket sang `CLOSED`.
9. Nếu vấn đề chưa được giải quyết, User có thể mở lại ticket `RESOLVED` sang
   `REOPENED`; Agent bắt đầu xử lý lại bằng cách chuyển sang `IN_PROGRESS`.

```text
OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED
                       |          |
                       v          v
               WAITING_FOR_USER  REOPENED -> IN_PROGRESS

OPEN -> CANCELLED
```

## 7. Quy tắc nghiệp vụ

- User chỉ được xem ticket do chính mình tạo.
- Agent được xem ticket chưa có người nhận và ticket được phân công cho mình.
- Admin được xem và quản lý tất cả ticket.
- Admin được phân công hoặc đổi Agent xử lý; Agent được tự nhận ticket chưa có
  người xử lý nhưng không được lấy ticket đã giao cho Agent khác.
- Chỉ User sở hữu ticket và Agent được phân công mới được bình luận.
- Ticket `CLOSED` không được chỉnh sửa nội dung hoặc thêm comment.
- Agent chỉ được chuyển ticket mình xử lý giữa các trạng thái hợp lệ:
  `ASSIGNED -> IN_PROGRESS`, `IN_PROGRESS -> WAITING_FOR_USER`,
  `WAITING_FOR_USER -> IN_PROGRESS`, `IN_PROGRESS -> RESOLVED`, và
  `REOPENED -> IN_PROGRESS`.
- User chỉ được đóng ticket khi ticket đang ở trạng thái `RESOLVED`.
- Mỗi ticket chỉ được đánh giá một lần.
- Mọi thay đổi quan trọng phải được ghi vào lịch sử ticket.

### Ma trận chuyển trạng thái chuẩn

| Từ                 | Sang               | Người được phép                    |
| ------------------ | ------------------ | ---------------------------------- |
| `OPEN`             | `ASSIGNED`         | ADMIN phân công hoặc AGENT tự nhận |
| `OPEN`             | `CANCELLED`        | USER sở hữu hoặc ADMIN             |
| `ASSIGNED`         | `IN_PROGRESS`      | AGENT được phân công               |
| `IN_PROGRESS`      | `WAITING_FOR_USER` | AGENT được phân công               |
| `WAITING_FOR_USER` | `IN_PROGRESS`      | AGENT được phân công               |
| `IN_PROGRESS`      | `RESOLVED`         | AGENT được phân công               |
| `RESOLVED`         | `CLOSED`           | USER sở hữu hoặc ADMIN             |
| `RESOLVED`         | `REOPENED`         | USER sở hữu                        |
| `REOPENED`         | `IN_PROGRESS`      | AGENT được phân công               |

Không cho phép transition ngoài bảng. Ticket `CLOSED` hoặc `CANCELLED` là trạng
thái kết thúc và không được sửa nội dung hay thêm comment.

## 8. Trạng thái và mức độ ưu tiên

### TicketStatus

```ts
enum TicketStatus {
  OPEN
  ASSIGNED
  IN_PROGRESS
  WAITING_FOR_USER
  RESOLVED
  REOPENED
  CLOSED
  CANCELLED
}
```

### TicketPriority

```ts
enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

### UserRole

```ts
enum UserRole {
  USER
  AGENT
  ADMIN
}
```

### UserStatus

```ts
enum UserStatus {
  ACTIVE
  BLOCKED
}
```

### NotificationType

```ts
enum NotificationType {
  TICKET_CREATED
  TICKET_ASSIGNED
  TICKET_STATUS_UPDATED
  COMMENT_CREATED
}
```

## 9. Thiết kế cơ sở dữ liệu

### User

| Trường       | Kiểu           | Ý nghĩa                 |
| ------------ | -------------- | ----------------------- |
| id           | UUID           | Khóa chính              |
| fullName     | String         | Họ tên                  |
| email        | String, unique | Email đăng nhập         |
| passwordHash | String         | Mật khẩu đã hash        |
| role         | UserRole       | Vai trò                 |
| avatarUrl    | String?        | Ảnh đại diện            |
| status       | UserStatus     | `ACTIVE` hoặc `BLOCKED` |
| deletedAt    | DateTime?      | Thời điểm soft delete   |
| createdAt    | DateTime       | Ngày tạo                |
| updatedAt    | DateTime       | Ngày cập nhật           |

### Category

| Trường      | Kiểu           | Ý nghĩa                      |
| ----------- | -------------- | ---------------------------- |
| id          | UUID           | Khóa chính                   |
| name        | String, unique | Tên danh mục                 |
| slug        | String, unique | Định danh dùng trong URL/API |
| description | String?        | Mô tả                        |
| isActive    | Boolean        | Có đang sử dụng không        |
| createdAt   | DateTime       | Ngày tạo                     |
| updatedAt   | DateTime       | Ngày cập nhật                |

Ví dụ danh mục: `Tài khoản`, `Phần mềm`, `Phần cứng`, `Mạng`, `Thanh toán`.

### Ticket

| Trường      | Kiểu           | Ý nghĩa                |
| ----------- | -------------- | ---------------------- |
| id          | UUID           | Khóa chính             |
| code        | String, unique | Mã hiển thị của ticket |
| title       | String         | Tiêu đề                |
| description | Text           | Nội dung               |
| status      | TicketStatus   | Trạng thái             |
| priority    | TicketPriority | Mức độ ưu tiên         |
| creatorId   | UUID           | Người tạo              |
| assigneeId  | UUID?          | Agent xử lý            |
| categoryId  | UUID           | Danh mục               |
| resolvedAt  | DateTime?      | Thời điểm giải quyết   |
| closedAt    | DateTime?      | Thời điểm đóng         |
| dueAt       | DateTime?      | Hạn xử lý              |
| deletedAt   | DateTime?      | Thời điểm soft delete  |
| createdAt   | DateTime       | Ngày tạo               |
| updatedAt   | DateTime       | Ngày cập nhật          |

### Comment

| Trường     | Kiểu     | Ý nghĩa                             |
| ---------- | -------- | ----------------------------------- |
| id         | UUID     | Khóa chính                          |
| content    | Text     | Nội dung bình luận                  |
| ticketId   | UUID     | Ticket liên quan                    |
| authorId   | UUID     | Người bình luận                     |
| isInternal | Boolean  | Ghi chú nội bộ, USER không được đọc |
| createdAt  | DateTime | Ngày tạo                            |
| updatedAt  | DateTime | Ngày cập nhật                       |

### Attachment

| Trường       | Kiểu           | Ý nghĩa                            |
| ------------ | -------------- | ---------------------------------- |
| id           | UUID           | Khóa chính                         |
| originalName | String         | Tên file gốc                       |
| fileName     | String, unique | Tên file ngẫu nhiên trong hệ thống |
| url          | String         | Đường dẫn file                     |
| mimeType     | String         | Loại file                          |
| size         | Int            | Kích thước file                    |
| ticketId     | UUID           | Ticket liên quan                   |
| uploaderId   | UUID           | Người upload                       |
| createdAt    | DateTime       | Ngày tạo                           |

### Notification

| Trường      | Kiểu             | Ý nghĩa              |
| ----------- | ---------------- | -------------------- |
| id          | UUID             | Khóa chính           |
| type        | NotificationType | Loại thông báo       |
| title       | String           | Tiêu đề              |
| message     | String           | Nội dung             |
| recipientId | UUID             | Người nhận           |
| actorId     | UUID?            | Người tạo ra sự kiện |
| ticketId    | UUID?            | Ticket liên quan     |
| isRead      | Boolean          | Đã đọc chưa          |
| createdAt   | DateTime         | Ngày tạo             |

### Rating

| Trường    | Kiểu         | Ý nghĩa              |
| --------- | ------------ | -------------------- |
| id        | UUID         | Khóa chính           |
| score     | Int          | Điểm từ 1 đến 5      |
| comment   | String?      | Nhận xét             |
| ticketId  | UUID, unique | Ticket được đánh giá |
| creatorId | UUID         | Người đánh giá       |
| agentId   | UUID         | Agent được đánh giá  |
| createdAt | DateTime     | Ngày tạo             |

### TicketHistory

| Trường    | Kiểu     | Ý nghĩa                                      |
| --------- | -------- | -------------------------------------------- |
| id        | UUID     | Khóa chính                                   |
| action    | String   | Hành động, ví dụ `CREATED`, `STATUS_UPDATED` |
| field     | String?  | Trường bị thay đổi nếu có                    |
| oldValue  | JSON?    | Dữ liệu cũ                                   |
| newValue  | JSON?    | Dữ liệu mới                                  |
| ticketId  | UUID     | Ticket liên quan                             |
| actorId   | UUID     | Người thực hiện                              |
| createdAt | DateTime | Ngày tạo                                     |

### RefreshToken

Lưu từng phiên đăng nhập với `id`, `tokenHash`, `userId`, `expiresAt`,
`revokedAt` và `createdAt`. Không lưu refresh token thô.

### PasswordResetToken

Lưu token đặt lại mật khẩu một lần với `id`, `tokenHash`, `userId`, `expiresAt`,
`usedAt` và `createdAt`. Không lưu hoặc log token thô.

### Quan hệ chính

- Một User có thể tạo nhiều Ticket.
- Một Agent có thể được giao nhiều Ticket.
- Một Category có nhiều Ticket.
- Một Ticket có nhiều Comment, Attachment, Notification và TicketHistory.
- Một Ticket có tối đa một Rating.

## 10. Danh sách API dự kiến

Base URL:

```text
http://localhost:3000/api/v1
```

Response thành công:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Response lỗi:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Dữ liệu không hợp lệ",
  "errors": [],
  "timestamp": "2026-09-01T00:00:00.000Z",
  "path": "/api/v1/example"
}
```

Response phân trang bổ sung `meta` gồm `page`, `limit`, `total` và
`totalPages` bên cạnh `data`.

### Authentication

| Method | Endpoint                | Quyền          | Chức năng                           |
| ------ | ----------------------- | -------------- | ----------------------------------- |
| POST   | `/auth/register`        | Public         | Đăng ký User                        |
| POST   | `/auth/login`           | Public         | Đăng nhập                           |
| POST   | `/auth/refresh`         | Public/Cookie  | Làm mới access token                |
| POST   | `/auth/logout`          | Refresh Cookie | Đăng xuất và thu hồi phiên hiện tại |
| GET    | `/auth/me`              | Authenticated  | Lấy người dùng hiện tại             |
| PATCH  | `/auth/change-password` | Authenticated  | Đổi mật khẩu và thu hồi mọi phiên   |
| POST   | `/auth/forgot-password` | Public         | Yêu cầu đặt lại mật khẩu            |
| POST   | `/auth/reset-password`  | Public/Token   | Đặt lại mật khẩu bằng token một lần |

### Users

| Method | Endpoint            | Quyền | Chức năng                     |
| ------ | ------------------- | ----- | ----------------------------- |
| GET    | `/users`            | Admin | Danh sách người dùng          |
| GET    | `/users/agents`     | Admin | Danh sách Agent               |
| GET    | `/users/:id`        | Admin | Chi tiết người dùng           |
| PATCH  | `/users/:id`        | Admin | Cập nhật thông tin người dùng |
| PATCH  | `/users/:id/role`   | Admin | Đổi role                      |
| PATCH  | `/users/:id/status` | Admin | Khóa/mở tài khoản             |
| DELETE | `/users/:id`        | Admin | Soft delete người dùng        |

### Categories

| Method | Endpoint          | Quyền         | Chức năng              |
| ------ | ----------------- | ------------- | ---------------------- |
| GET    | `/categories`     | Authenticated | Danh sách danh mục     |
| GET    | `/categories/:id` | Authenticated | Chi tiết danh mục      |
| POST   | `/categories`     | Admin         | Tạo danh mục           |
| PATCH  | `/categories/:id` | Admin         | Cập nhật danh mục      |
| DELETE | `/categories/:id` | Admin         | Ngừng sử dụng danh mục |

### Tickets

| Method | Endpoint               | Quyền             | Chức năng                          |
| ------ | ---------------------- | ----------------- | ---------------------------------- |
| POST   | `/tickets`             | User              | Tạo ticket                         |
| GET    | `/tickets`             | Theo role         | Danh sách ticket được phép xem     |
| GET    | `/tickets/:id`         | Theo quyền sở hữu | Chi tiết ticket                    |
| PATCH  | `/tickets/:id`         | User              | Sửa ticket khi còn `OPEN`          |
| DELETE | `/tickets/:id`         | User sở hữu/Admin | Soft delete hoặc hủy ticket hợp lệ |
| PATCH  | `/tickets/:id/assign`  | Admin             | Phân công Agent                    |
| PATCH  | `/tickets/:id/take`    | Agent             | Nhận ticket chưa được phân công    |
| PATCH  | `/tickets/:id/status`  | Theo nghiệp vụ    | Đổi trạng thái                     |
| GET    | `/tickets/:id/history` | Liên quan/Admin   | Lịch sử ticket                     |

Query cho API danh sách:

```text
GET /tickets?page=1&limit=10&status=OPEN&priority=HIGH&search=login
```

### Comments và attachments

| Method | Endpoint                      | Quyền           | Chức năng           |
| ------ | ----------------------------- | --------------- | ------------------- |
| GET    | `/tickets/:id/comments`       | Người liên quan | Danh sách bình luận |
| POST   | `/tickets/:id/comments`       | Người liên quan | Thêm bình luận      |
| POST   | `/tickets/:id/internal-notes` | Agent/Admin     | Thêm ghi chú nội bộ |
| POST   | `/tickets/:id/attachments`    | Người liên quan | Upload file         |
| DELETE | `/attachments/:id`            | Chủ file/Admin  | Xóa file            |

### Notifications và ratings

| Method | Endpoint                  | Quyền         | Chức năng           |
| ------ | ------------------------- | ------------- | ------------------- |
| GET    | `/notifications`          | Authenticated | Danh sách thông báo |
| PATCH  | `/notifications/:id/read` | Chủ sở hữu    | Đánh dấu đã đọc     |
| PATCH  | `/notifications/read-all` | Authenticated | Đọc tất cả          |
| POST   | `/tickets/:id/rating`     | User sở hữu   | Đánh giá ticket     |

### Dashboard

| Method | Endpoint           | Quyền | Chức năng               |
| ------ | ------------------ | ----- | ----------------------- |
| GET    | `/dashboard/admin` | Admin | Thống kê toàn hệ thống  |
| GET    | `/dashboard/agent` | Agent | Thống kê cá nhân        |
| GET    | `/dashboard/user`  | User  | Thống kê ticket cá nhân |

## 11. Authentication và bảo mật

- Mật khẩu được hash bằng `bcrypt`.
- Access token có thời hạn ngắn, ví dụ 15 phút.
- Refresh token có thời hạn dài hơn, ví dụ 7 ngày.
- Refresh token lưu trong cookie `HttpOnly`, `Secure` ở production và `SameSite` phù hợp.
- Hash refresh token được lưu trong PostgreSQL để có thể thu hồi khi logout.
- Token đặt lại mật khẩu chỉ lưu dạng hash và dùng một lần; không bao giờ trả
  raw token trong response API. Email provider phải gửi link/token đặt lại mật
  khẩu; khi chưa cấu hình provider, endpoint vẫn trả response chống dò tài khoản
  nhưng chưa thể hoàn tất luồng reset từ bên ngoài.
- NestJS dùng JWT Guard để xác thực.
- Dùng Roles Guard và kiểm tra ownership trong service để phân quyền.
- Không dựa vào việc ẩn nút trên frontend để bảo vệ API.
- Validate DTO bằng `class-validator`.
- Giới hạn loại và kích thước file upload.
- Mỗi file tối đa 10 MB; chỉ cho phép `jpg`, `jpeg`, `png`, `webp`, `pdf`,
  `doc`, `docx`; phải kiểm tra extension và nội dung file, không chỉ tin MIME từ
  client.
- Cấu hình CORS chỉ cho phép domain frontend hợp lệ.
- Không commit `.env` hoặc secret lên GitHub.

## 12. Trang giao diện dự kiến

### Public

- `/login`
- `/register`

### User

- `/dashboard`
- `/tickets`
- `/tickets/new`
- `/tickets/[id]`
- `/profile`

### Agent

- `/agent/dashboard`
- `/agent/tickets`
- `/agent/tickets/[id]`

### Admin

- `/admin/dashboard`
- `/admin/tickets`
- `/admin/tickets/[id]`
- `/admin/users`
- `/admin/categories`

## 13. Cấu trúc thư mục đề xuất

```text
helpdesk-pro/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── tickets/
│   │   │   ├── categories/
│   │   │   ├── comments/
│   │   │   ├── attachments/
│   │   │   ├── notifications/
│   │   │   ├── ratings/
│   │   │   └── dashboard/
│   │   ├── prisma/
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   ├── enums/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   └── interceptors/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/
│   ├── .env.example
│   ├── package.json
│   └── docker-compose.yml
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (user)/
│   │   ├── agent/
│   │   └── admin/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── types/
│   ├── .env.local.example
│   └── package.json
├── README.md
└── .gitignore
```

## 14. Biến môi trường dự kiến

### Backend `.env.example`

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/helpdesk
FRONTEND_URL=http://localhost:3001
JWT_ACCESS_SECRET=change_me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change_me
JWT_REFRESH_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASSWORD=
```

### Frontend `.env.local.example`

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

## 15. Dữ liệu demo

Seed sáu tài khoản để nhà tuyển dụng dễ kiểm tra; ba tài khoản chính:

```text
admin@example.com    / Admin@123
staff@example.com    / Staff@123
customer@example.com / Customer@123
```

> Đây chỉ là tài khoản demo. Không sử dụng các mật khẩu này trong sản phẩm thật.

Seed thêm 1 Agent và 2 User với cùng mật khẩu demo theo vai trò, cùng với:

- 5 category.
- Tổng cộng 2 Agent và 3 User.
- 18 ticket ở nhiều trạng thái.
- Comment và notification mẫu.

## 16. Kế hoạch triển khai

### Giai đoạn 1 — Khởi tạo

- [x] Tạo monorepo gồm `frontend` và `backend`.
- [x] Khởi tạo NestJS.
- [x] Khởi tạo Next.js.
- [x] Chạy PostgreSQL bằng Docker Compose.
- [x] Cấu hình Prisma và migration đầu tiên.
- [x] Cấu hình ValidationPipe, CORS và Swagger.

### Giai đoạn 2 — Authentication

- [x] Thiết kế model User.
- [x] Đăng ký User.
- [x] Đăng nhập.
- [x] Access token và refresh token.
- [x] Logout và thu hồi refresh token.
- [x] JWT Guard, Roles Guard và decorator `@Roles()`.
- [x] Làm trang đăng ký và đăng nhập.

### Giai đoạn 3 — Ticket MVP

- [x] Model Category và Ticket.
- [x] Admin CRUD category.
- [x] User tạo ticket.
- [x] Danh sách ticket theo role.
- [x] Chi tiết ticket.
- [x] Search, filter, sort và pagination.
- [x] Admin phân công Agent.
- [x] Cập nhật trạng thái đúng quy tắc nghiệp vụ.

### Giai đoạn 4 — Trao đổi

- [x] Model Comment và Attachment.
- [x] User và Agent bình luận.
- [x] Upload ảnh/file.
- [x] Lưu lịch sử thay đổi ticket.
- [x] Hoàn thiện trang chi tiết ticket.

### Giai đoạn 5 — Thông báo và dashboard

- [x] Lưu notification vào PostgreSQL.
- [x] Thông báo real-time bằng Socket.IO.
- [x] Đánh dấu đã đọc.
- [x] Dashboard theo role.
- [x] Rating sau khi đóng ticket.

### Giai đoạn 6 — Hoàn thiện

- [x] Unit test cho các service quan trọng.
- [x] E2E test cho auth và ticket flow.
- [x] Xử lý lỗi thống nhất.
- [x] Docker hóa frontend và backend.
- [x] Viết README hướng dẫn chạy.
- [ ] Deploy frontend, backend và database.
- [x] Kiểm tra lại tài khoản demo.

## 17. MVP bắt buộc và tính năng nâng cao

### MVP bắt buộc

- Authentication và ba role.
- CRUD category.
- Tạo, xem, lọc và phân trang ticket.
- Phân công Agent.
- Cập nhật trạng thái theo nghiệp vụ.
- Comment.
- Notification lưu trong PostgreSQL.
- Swagger.
- Seed tài khoản demo.
- Docker và deploy.

### Chỉ làm sau khi MVP hoàn thành

- Socket.IO real-time.
- Upload Cloudinary.
- Email notification.
- SLA và ticket quá hạn.
- Rating.
- Dashboard nâng cao.
- Redis cache.
- BullMQ background jobs.
- AI phân loại hoặc tóm tắt ticket.

## 18. SLA (tính năng nâng cao)

SLA là thời hạn ticket cần được xử lý:

| Priority | Thời hạn gợi ý |
| -------- | -------------: |
| LOW      |         72 giờ |
| MEDIUM   |         48 giờ |
| HIGH     |         24 giờ |
| URGENT   |          4 giờ |

Khi tạo ticket, backend tính `dueAt`. Một cron job định kỳ kiểm tra ticket chưa hoàn thành nhưng đã quá `dueAt`, sau đó tạo thông báo cho Admin và Agent.

## 19. Redis có bắt buộc không?

Không. Phiên bản đầu sử dụng:

```text
Next.js + NestJS + PostgreSQL
```

Có thể bổ sung Redis sau cho:

- Cache dashboard.
- BullMQ gửi email ở background.
- Rate limiting phân tán.
- Đồng bộ Socket.IO khi chạy nhiều backend instance.

Không dùng Redis thì notification vẫn được lưu trong PostgreSQL và Socket.IO vẫn hoạt động bình thường khi chỉ chạy một NestJS server.

## 20. Tiêu chí hoàn thành

Project được xem là sẵn sàng đưa vào CV khi:

- Có URL frontend và backend hoạt động.
- Swagger có thể truy cập.
- Có tài khoản demo cho đủ ba role.
- Toàn bộ luồng `OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED` hoạt động.
- Không thể truy cập ticket trái phép bằng cách đổi ID trên URL/API.
- Filter và pagination hoạt động.
- Có validation và thông báo lỗi rõ ràng.
- Có migration và seed data.
- Clone repository và chạy được theo README.
- Không có secret trong GitHub.
- Có ảnh chụp hoặc video demo ngắn.

## 21. Nội dung ghi trong CV

**HelpDesk Pro — Support Ticket Management System**

> Developed a full-stack support ticket management system using Next.js, NestJS, PostgreSQL and Prisma. Implemented JWT authentication, role-based access control, ticket assignment workflow, comments, real-time notifications, API documentation, automated tests and Docker deployment.

## 22. Các câu hỏi cần tự trả lời trước phỏng vấn

- Vì sao tách Next.js và NestJS thành hai ứng dụng?
- Access token và refresh token khác nhau thế nào?
- Vì sao refresh token lưu trong HttpOnly cookie?
- Roles Guard khác ownership check thế nào?
- Làm sao ngăn User xem ticket của người khác?
- Làm sao tránh hai Admin cập nhật cùng một ticket gây sai dữ liệu?
- Vì sao chọn PostgreSQL?
- Những cột nào cần index?
- Transaction được dùng ở nghiệp vụ nào?
- Socket mất kết nối thì notification có mất không?
- Vì sao notification vẫn cần lưu trong PostgreSQL?
- Redis giải quyết vấn đề gì và vì sao MVP chưa cần Redis?

## 23. Thứ tự bắt đầu đề xuất

Không làm tất cả chức năng cùng lúc. Thứ tự tốt nhất là:

```text
Khởi tạo project
-> Database và Prisma
-> Authentication
-> Authorization
-> Ticket MVP
-> Comment
-> Frontend
-> Notification
-> Test
-> Docker
-> Deploy
-> Tính năng nâng cao
```

Ưu tiên một sản phẩm nhỏ nhưng hoàn chỉnh, deploy được và giải thích được toàn bộ code.
