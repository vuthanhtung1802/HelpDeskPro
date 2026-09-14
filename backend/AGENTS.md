# AGENTS.md — Backend implementation rules

## 1. Source of truth

Trước khi thay đổi backend, phải đọc file [`../PROJECT_SPEC.md`](../PROJECT_SPEC.md).
Đây là nguồn chuẩn duy nhất cho:

- Yêu cầu sản phẩm và phạm vi MVP.
- Vai trò, quyền hạn và luồng nghiệp vụ.
- API contract, trạng thái ticket và quy tắc chuyển trạng thái.
- Database models, field names, seed data và port của ứng dụng.
- Thứ tự triển khai tính năng.

File này chỉ quy định cách triển khai backend. Không định nghĩa lại business rule.
Nếu nội dung ở đây và `PROJECT_SPEC.md` khác nhau, phải tuân theo
`PROJECT_SPEC.md` và cập nhật file này để loại bỏ xung đột.

## 2. Technology constraints

- Node.js, NestJS và TypeScript.
- PostgreSQL và Prisma ORM.
- Passport JWT, bcrypt, `class-validator` và `class-transformer`.
- Socket.IO, Swagger và Jest.
- Docker Compose cho môi trường local/production mẫu.
- Không dùng Redis trước khi MVP hoàn thành.
- Không thêm dependency production nếu chưa thực sự cần; khi thêm phải giải
  thích lý do.

## 3. Project structure

```text
src/
├── common/
│   ├── constants/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── types/
│   └── utils/
├── config/
├── prisma/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── categories/
│   ├── tickets/
│   ├── comments/
│   ├── attachments/
│   ├── notifications/
│   └── dashboard/
├── app.module.ts
└── main.ts
```

- Chỉ tạo folder khi có file thực sự sử dụng.
- Controller chỉ xử lý HTTP và gọi service.
- Business logic nằm trong service hoặc domain service phù hợp.
- Mọi database access đi qua `PrismaService`.
- DTO nằm trong module tương ứng; thành phần dùng chung nằm trong `src/common`.
- Không tạo abstraction thừa, file rỗng hoặc dependency vòng tròn.

## 4. TypeScript and code conventions

- Bật strict TypeScript và không dùng `any` nếu không thật sự cần.
- Tên class, hàm và biến phải thể hiện đúng trách nhiệm.
- Một hàm chỉ đảm nhiệm một trách nhiệm chính.
- Không lặp lại business logic hoặc hard-code secret/cấu hình môi trường.
- Không viết pseudo-code hoặc để `TODO` trong chức năng được yêu cầu hoàn thành.
- Không bỏ qua import hoặc lỗi TypeScript.
- Dùng constructor injection theo convention NestJS.
- Dùng enum/constant dùng chung thay vì lặp string.
- Dùng transaction cho thao tác cập nhật nhiều bảng liên quan.
- Chỉ comment khi cần giải thích quyết định hoặc quy tắc khó hiểu.

## 5. DTO and API conventions

- Tất cả input từ client phải qua DTO dùng `class-validator`.
- Không dùng Prisma type làm request DTO.
- Tách Create, Update và Query DTO.
- Validate UUID, enum, page, limit và giới hạn độ dài chuỗi.
- Global `ValidationPipe` phải bật `whitelist`, `forbidNonWhitelisted` và
  `transform`.
- API dùng prefix `/api/v1`.
- Dùng HTTP status code chính xác.
- Response thành công được chuẩn hóa bởi response interceptor.
- Response lỗi được chuẩn hóa bởi global exception filter.
- Không để lộ stack trace hoặc dữ liệu nhạy cảm.
- Swagger tại `/api/docs` phải phản ánh đúng endpoint và DTO thực tế.

## 6. Security requirements

- Không commit `.env`, token hoặc secret.
- Validate toàn bộ biến môi trường khi ứng dụng khởi động.
- Dùng Helmet và CORS theo `FRONTEND_URL`.
- Rate limit các endpoint xác thực nhạy cảm.
- Không trả password hash, refresh-token hash hoặc reset-token hash.
- Refresh token chỉ gửi qua HttpOnly Cookie; database chỉ lưu hash.
- Kiểm tra role và ownership trong backend để chống IDOR.
- Không dựa vào việc ẩn UI để bảo vệ API.
- Không log password, JWT, cookie hoặc reset token.
- Upload phải giới hạn kích thước, extension và kiểm tra loại nội dung.
- Không tự tạo hoặc thay đổi secret production.

## 7. Database and migrations

- Prisma schema phải khớp với database contract trong `PROJECT_SPEC.md`.
- Không sửa migration đã có thể được áp dụng; tạo migration cộng thêm.
- Không xóa cứng dữ liệu có quan hệ nếu spec yêu cầu khóa hoặc soft delete.
- Thao tác đồng thời quan trọng phải có transaction hoặc optimistic check.
- Seed phải idempotent và không xóa dữ liệu ngoài bộ demo do seed quản lý.
- Sau khi đổi schema phải chạy `prisma format`, `prisma validate` và
  `prisma generate`.

## 8. Testing requirements

- Unit test phải kiểm tra hành vi, không chỉ tăng coverage.
- Bắt buộc test service quan trọng, permission/ownership và ticket transition.
- E2E test phải bao phủ auth và ticket flow được liệt kê trong
  `PROJECT_SPEC.md`.
- Không khẳng định test thành công nếu lệnh chưa thực sự chạy.

Sau mỗi thay đổi, chạy các kiểm tra phù hợp:

```bash
npm run format
npm run lint
npm run build
npm run test
npm run test:e2e
```

Nếu lệnh không thể chạy do thiếu PostgreSQL, Docker hoặc quyền môi trường, phải
báo rõ lệnh nào chưa chạy và nguyên nhân.

## 9. Refactoring rules

Trước khi refactor:

1. Kiểm tra cấu trúc và Git status.
2. Đọc toàn bộ file liên quan.
3. Xác định dependency và hành vi hiện tại.
4. Nêu vấn đề, cấu trúc đề xuất và file dự kiến thay đổi.

Trong khi refactor:

- Không thay đổi hành vi ngoài phạm vi yêu cầu.
- Không ghi đè thay đổi không liên quan của người dùng.
- Không xóa file cho đến khi xác nhận không còn được sử dụng.
- Khi đổi tên/di chuyển file phải cập nhật toàn bộ import.
- Luôn giữ project ở trạng thái build được.

## 10. Working order

Thực hiện theo roadmap trong `PROJECT_SPEC.md`, mỗi lần chỉ làm một giai đoạn có
thể kiểm tra độc lập. Không xây dựng toàn bộ hệ thống trong một thay đổi lớn.

Trước khi viết code:

1. Đọc `PROJECT_SPEC.md` và file này.
2. Kiểm tra repository, dependencies, Prisma schema và Git status.
3. Đọc file liên quan và xác định ảnh hưởng.
4. Trình bày kế hoạch ngắn gọn.

Khi hoàn thành phải báo:

- Chức năng đã hoàn thành và phần chưa hoàn thành.
- File đã tạo, chỉnh sửa, di chuyển hoặc đổi tên.
- Migration đã tạo nếu có.
- Kết quả format, lint, build, unit test và e2e test.
- Rủi ro hoặc điều kiện môi trường còn lại.
