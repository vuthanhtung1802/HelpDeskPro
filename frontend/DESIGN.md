# HelpDesk Pro — Frontend Design System & UI/UX Specification

> Phiên bản: 1.0  
> Phạm vi: Frontend Next.js  
> Trạng thái: Nguồn quy chuẩn chính cho UI/UX của HelpDesk Pro

## 1. Mục đích tài liệu

`DESIGN.md` quy định cách giao diện HelpDesk Pro phải được thiết kế và triển khai để:

- Thống nhất trải nghiệm giữa ba vai trò `USER`, `AGENT` và `ADMIN`.
- Giúp người dùng tạo, theo dõi và xử lý ticket nhanh, ít nhầm lẫn.
- Bảo đảm các page và component có cùng ngôn ngữ thiết kế.
- Hạn chế hard-code màu, khoảng cách, kích thước và trạng thái trong từng page.
- Tạo cơ sở rõ ràng để refactor hoặc mở rộng frontend về sau.
- Bảo đảm responsive, accessibility và các trạng thái loading, empty, error.

Tài liệu này không định nghĩa database, API hoặc business rule chi tiết. Những nội dung đó thuộc `../PROJECT_SPEC.md`.

## 2. Phạm vi và nguồn sự thật

### 2.1. Trách nhiệm của từng tài liệu

| Tài liệu | Trách nhiệm |
| --- | --- |
| `../PROJECT_SPEC.md` | Chức năng, vai trò, quyền hạn, business rule, database và API contract dùng chung FE/BE |
| `./DESIGN.md` | UI, UX, visual language, layout, responsive và component conventions của frontend |
| `./AGENTS.md` | Cách Codex tổ chức, chỉnh sửa, refactor và kiểm tra code frontend |
| `README.md` | Hướng dẫn cài đặt, chạy và sử dụng project |

### 2.2. Thứ tự ưu tiên khi xung đột

1. Yêu cầu mới nhất của người dùng.
2. Business rule và API contract trong `../PROJECT_SPEC.md`.
3. UI/UX và design convention trong `./DESIGN.md`.
4. Quy tắc kỹ thuật trong `AGENTS.md` gần file đang chỉnh sửa nhất.
5. Code hiện tại.
6. README và tài liệu khác.

Nếu xung đột ảnh hưởng API, authentication, authorization, dữ liệu hoặc luồng nghiệp vụ chính, không được tự quyết định. Phải báo rõ và hỏi người dùng.

## 3. Tổng quan sản phẩm

HelpDesk Pro là hệ thống quản lý yêu cầu hỗ trợ với ba vai trò:

| Vai trò | Mục tiêu chính trên giao diện |
| --- | --- |
| `USER` | Tạo ticket, xem tiến độ, trao đổi với đội hỗ trợ và quản lý hồ sơ cá nhân |
| `AGENT` | Nhận, phân loại, xử lý, phản hồi và cập nhật trạng thái ticket |
| `ADMIN` | Theo dõi toàn hệ thống, quản lý ticket, người dùng, agent và danh mục |

Giao diện phải ưu tiên công việc cần làm tiếp theo. Thông tin quan trọng như trạng thái, độ ưu tiên, người phụ trách và thời gian cập nhật gần nhất phải dễ nhận biết nhưng không gây rối mắt.

## 4. Nguyên tắc thiết kế

### 4.1. Rõ ràng

- Mỗi page chỉ có một mục tiêu chính.
- Tiêu đề page phải mô tả đúng nội dung hiện tại.
- Primary action phải nổi bật hơn secondary action.
- Label sử dụng ngôn ngữ dễ hiểu, tránh thuật ngữ kỹ thuật không cần thiết.
- Trạng thái không chỉ được biểu diễn bằng màu; phải có text hoặc icon đi kèm.

### 4.2. Nhất quán

- Cùng một hành động phải dùng cùng tên, icon, màu và vị trí tương đối.
- Các role có thể có menu khác nhau nhưng dùng chung cấu trúc app shell.
- Không tạo phiên bản Button, Badge, Dialog hoặc Input riêng trong từng feature nếu component dùng chung đáp ứng được.
- Không hard-code design value khi đã có token.

### 4.3. Hiệu quả

- Các thao tác thường dùng cần ít bước và dễ tiếp cận.
- Search, filter và sort phải giữ trạng thái hợp lý khi người dùng mở ticket rồi quay lại danh sách.
- Không yêu cầu người dùng nhập lại dữ liệu sau khi request thất bại.
- Danh sách dài phải có pagination hoặc cơ chế tải thêm được đặc tả rõ.

### 4.4. An toàn

- Thao tác nguy hiểm phải có xác nhận.
- Không dùng primary color cho thao tác xóa, khóa tài khoản hoặc hành động không thể hoàn tác.
- Giao diện không được hiển thị action mà người dùng không có quyền thực hiện.
- Dữ liệu nhạy cảm và internal note không được render cho `USER`, kể cả ở trạng thái ẩn bằng CSS.

### 4.5. Bao quát trạng thái

Mọi page hoặc vùng dữ liệu bất đồng bộ phải xem xét đủ:

- Initial loading.
- Background refreshing.
- Empty.
- No search/filter results.
- Partial data.
- Success.
- Validation error.
- Request error.
- Unauthorized.
- Forbidden.
- Not found.
- Offline hoặc network unavailable nếu có thể phát hiện.

## 5. Kiến trúc thông tin và route

Hệ thống hiện có 12 page tĩnh và 3 route chi tiết động, tổng cộng 15 page/route.

### 5.1. Public

| Page | Route | Quyền |
| --- | --- | --- |
| Đăng nhập | `/login` | Public |
| Đăng ký | `/register` | Public |

### 5.2. USER

| Page | Route | Quyền |
| --- | --- | --- |
| Tổng quan | `/dashboard` | `USER` |
| Danh sách ticket | `/tickets` | `USER` |
| Tạo ticket | `/tickets/new` | `USER` |
| Chi tiết ticket | `/tickets/[id]` | `USER`, chỉ ticket được phép xem |
| Hồ sơ cá nhân | `/profile` | `USER` |

### 5.3. AGENT

| Page | Route | Quyền |
| --- | --- | --- |
| Agent Dashboard | `/staff/dashboard` | `AGENT` |
| Danh sách ticket | `/staff/tickets` | `AGENT` |
| Chi tiết ticket | `/staff/tickets/[id]` | `AGENT`, theo quyền nghiệp vụ |

### 5.4. ADMIN

| Page | Route | Quyền |
| --- | --- | --- |
| Admin Dashboard | `/admin/dashboard` | `ADMIN` |
| Quản lý ticket | `/admin/tickets` | `ADMIN` |
| Chi tiết ticket | `/admin/tickets/[id]` | `ADMIN` |
| Quản lý người dùng | `/admin/users` | `ADMIN` |
| Quản lý danh mục | `/admin/categories` | `ADMIN` |

### 5.5. Route ngoài phạm vi hiện tại

Các route như forgot password, reset password, settings, audit log hoặc notification center không tự động được thêm. Chỉ bổ sung khi `PROJECT_SPEC.md` hoặc yêu cầu mới xác nhận.

## 6. Ngôn ngữ hình ảnh

### 6.1. Phong cách

- Hiện đại, gọn, đáng tin cậy và phù hợp ứng dụng quản trị.
- Nền tổng thể xám xanh rất nhạt; nội dung chính đặt trên surface trắng.
- Màu xanh dương là màu hành động chính.
- Card có border nhẹ; shadow chỉ dùng khi cần thể hiện lớp nổi.
- Hạn chế gradient, glassmorphism và hiệu ứng trang trí không phục vụ thao tác.
- Mật độ thông tin vừa phải: thoáng hơn dashboard doanh nghiệp cũ nhưng không lãng phí không gian.

### 6.2. Theme

- Phiên bản 1 ưu tiên light theme.
- Mọi màu phải dùng semantic token để có thể thêm dark theme mà không sửa từng component.
- Không triển khai dark mode nửa vời. Chỉ bật theme switch khi toàn bộ page và state đã được kiểm tra.

## 7. Design tokens

### 7.1. Color tokens nền tảng

| Token | Giá trị | Mục đích |
| --- | --- | --- |
| `--color-primary-50` | `#EFF6FF` | Nền primary rất nhẹ |
| `--color-primary-100` | `#DBEAFE` | Hover nền nhẹ, selected item |
| `--color-primary-200` | `#BFDBFE` | Border focus nhẹ |
| `--color-primary-500` | `#3B82F6` | Icon hoặc điểm nhấn |
| `--color-primary-600` | `#2563EB` | Primary button, active link |
| `--color-primary-700` | `#1D4ED8` | Primary hover |
| `--color-primary-800` | `#1E40AF` | Primary active |
| `--color-neutral-0` | `#FFFFFF` | Surface chính |
| `--color-neutral-50` | `#F8FAFC` | App background |
| `--color-neutral-100` | `#F1F5F9` | Subtle background |
| `--color-neutral-200` | `#E2E8F0` | Border mặc định |
| `--color-neutral-300` | `#CBD5E1` | Border mạnh, disabled control |
| `--color-neutral-400` | `#94A3B8` | Placeholder, disabled text |
| `--color-neutral-500` | `#64748B` | Text phụ |
| `--color-neutral-600` | `#475569` | Secondary text đậm |
| `--color-neutral-700` | `#334155` | Heading phụ |
| `--color-neutral-800` | `#1E293B` | Heading |
| `--color-neutral-900` | `#0F172A` | Text chính |
| `--color-success-50` | `#F0FDF4` | Success background |
| `--color-success-600` | `#16A34A` | Success foreground |
| `--color-warning-50` | `#FFFBEB` | Warning background |
| `--color-warning-600` | `#D97706` | Warning foreground |
| `--color-danger-50` | `#FEF2F2` | Danger background |
| `--color-danger-600` | `#DC2626` | Error và destructive action |
| `--color-info-50` | `#EFF6FF` | Info background |
| `--color-info-600` | `#2563EB` | Info foreground |

### 7.2. Semantic color tokens

Component chỉ nên sử dụng semantic token dưới đây thay vì gọi trực tiếp palette token khi có thể.

| Token | Ánh xạ mặc định |
| --- | --- |
| `--background` | `--color-neutral-50` |
| `--surface` | `--color-neutral-0` |
| `--surface-subtle` | `--color-neutral-100` |
| `--foreground` | `--color-neutral-900` |
| `--foreground-secondary` | `--color-neutral-600` |
| `--foreground-muted` | `--color-neutral-500` |
| `--border` | `--color-neutral-200` |
| `--border-strong` | `--color-neutral-300` |
| `--focus-ring` | `--color-primary-500` |
| `--primary` | `--color-primary-600` |
| `--primary-hover` | `--color-primary-700` |
| `--primary-active` | `--color-primary-800` |
| `--danger` | `--color-danger-600` |
| `--success` | `--color-success-600` |
| `--warning` | `--color-warning-600` |
| `--info` | `--color-info-600` |

### 7.3. Ticket status tokens

Màu trạng thái phải được ánh xạ tại một nơi duy nhất, ví dụ `TICKET_STATUS_META`. Không rải điều kiện màu theo từng component.

| Status | Label tiếng Việt | Background | Foreground | Icon gợi ý |
| --- | --- | --- | --- | --- |
| `OPEN` | Mới mở | `#EFF6FF` | `#1D4ED8` | CircleDot |
| `ASSIGNED` | Đã phân công | `#F5F3FF` | `#6D28D9` | UserCheck |
| `IN_PROGRESS` | Đang xử lý | `#ECFEFF` | `#0E7490` | LoaderCircle |
| `WAITING_FOR_USER` | Chờ phản hồi | `#FFFBEB` | `#B45309` | Clock3 |
| `RESOLVED` | Đã giải quyết | `#F0FDF4` | `#15803D` | CircleCheck |
| `REOPENED` | Đã mở lại | `#FFF7ED` | `#C2410C` | RotateCcw |
| `CLOSED` | Đã đóng | `#F1F5F9` | `#475569` | LockKeyhole |
| `CANCELLED` | Đã hủy | `#FEF2F2` | `#B91C1C` | CircleX |

Quy tắc:

- Badge luôn hiển thị label, không chỉ hiển thị chấm màu.
- Icon là tùy chọn nhưng phải nhất quán ở tất cả nơi xuất hiện.
- Không suy đoán status transition ở UI; action phải dựa trên business rule/API.
- `CLOSED` không dùng cùng kiểu với disabled control vì đây là trạng thái dữ liệu hợp lệ.

### 7.4. Priority tokens

| Priority | Label tiếng Việt | Background | Foreground |
| --- | --- | --- | --- |
| `LOW` | Thấp | `#F1F5F9` | `#475569` |
| `MEDIUM` | Trung bình | `#EFF6FF` | `#1D4ED8` |
| `HIGH` | Cao | `#FFF7ED` | `#C2410C` |
| `URGENT` | Khẩn cấp | `#FEF2F2` | `#B91C1C` |

`URGENT` không được dùng animation nhấp nháy. Có thể dùng icon cảnh báo và font weight 600.

### 7.5. CSS variable tham chiếu

```css
:root {
  --background: #f8fafc;
  --surface: #ffffff;
  --surface-subtle: #f1f5f9;
  --foreground: #0f172a;
  --foreground-secondary: #475569;
  --foreground-muted: #64748b;
  --border: #e2e8f0;
  --border-strong: #cbd5e1;

  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-active: #1e40af;
  --primary-foreground: #ffffff;

  --success: #16a34a;
  --warning: #d97706;
  --danger: #dc2626;
  --info: #2563eb;

  --focus-ring: #3b82f6;
}
```

Nếu dùng Tailwind CSS, ánh xạ các biến này vào theme. Không thay tất cả bằng utility có giá trị màu hex trực tiếp trong JSX.

## 8. Typography

### 8.1. Font family

- Primary: `Geist Sans`.
- Fallback: `Inter`, `ui-sans-serif`, `system-ui`, `sans-serif`.
- Monospace cho ID kỹ thuật hoặc code: `Geist Mono`, `ui-monospace`, `monospace`.
- Font phải hỗ trợ tiếng Việt đầy đủ.

### 8.2. Type scale

| Token | Size / line-height | Weight | Sử dụng |
| --- | --- | --- | --- |
| `display-sm` | `30px / 38px` | 700 | Auth heading hoặc màn hình đặc biệt, dùng hạn chế |
| `heading-1` | `28px / 36px` | 700 | Page title desktop |
| `heading-2` | `24px / 32px` | 700 | Section lớn, dialog quan trọng |
| `heading-3` | `20px / 28px` | 600 | Card heading, section heading |
| `heading-4` | `18px / 26px` | 600 | Subsection |
| `body-lg` | `16px / 26px` | 400 | Intro, description quan trọng |
| `body-md` | `14px / 22px` | 400 | Text mặc định |
| `body-sm` | `13px / 20px` | 400 | Metadata, table phụ |
| `label-md` | `14px / 20px` | 600 | Label, button |
| `label-sm` | `12px / 18px` | 600 | Badge, compact label |
| `caption` | `12px / 18px` | 400 | Helper text, timestamp |

### 8.3. Quy tắc typography

- Mỗi page chỉ có một `h1`.
- Không chọn heading level chỉ vì kích thước; phải đúng cấu trúc nội dung.
- Trên mobile, `heading-1` có thể hiển thị `24px / 32px`.
- Body text không nhỏ hơn 14px; chỉ metadata hoặc caption mới dùng 12–13px.
- Không dùng font weight 700 cho toàn bộ card hoặc hàng table.
- Ticket title dài tối đa hai dòng ở card/list; trang chi tiết hiển thị đầy đủ.
- ID ticket có thể dùng monospace nhưng không làm giảm khả năng đọc.

## 9. Spacing, sizing và hình khối

### 9.1. Spacing scale

| Token | Giá trị |
| --- | ---: |
| `space-0` | 0 |
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |

### 9.2. Khoảng cách tiêu chuẩn

| Vị trí | Desktop | Mobile |
| --- | ---: | ---: |
| Page content padding | 24–32px | 16px |
| Khoảng cách PageHeader → content | 24px | 20px |
| Khoảng cách section | 32px | 24px |
| Card padding mặc định | 24px | 16px |
| Card gap trong dashboard | 16–24px | 12–16px |
| Form field gap | 16px | 16px |
| Label → control | 6–8px | 6–8px |
| Dialog body spacing | 20–24px | 16px |

### 9.3. Control sizing

| Size | Height | Horizontal padding | Sử dụng |
| --- | ---: | ---: | --- |
| `sm` | 32px | 12px | Compact filter, table action |
| `md` | 40px | 16px | Mặc định |
| `lg` | 48px | 20px | Auth hoặc primary action lớn |

- Touch target thực tế không nhỏ hơn `44 × 44px` trên mobile.
- Textarea mặc định tối thiểu 120px cao.
- Search input desktop nên rộng 240–320px; mobile chiếm toàn bộ chiều rộng.

### 9.4. Border radius

| Token | Giá trị | Sử dụng |
| --- | ---: | --- |
| `radius-sm` | 6px | Badge, compact control |
| `radius-md` | 8px | Input, button, dropdown |
| `radius-lg` | 12px | Card, modal |
| `radius-xl` | 16px | Auth card hoặc surface nổi bật |
| `radius-full` | 9999px | Avatar, pill badge |

Không dùng quá nhiều radius khác nhau trong cùng một page.

### 9.5. Shadow

| Token | Giá trị | Sử dụng |
| --- | --- | --- |
| `shadow-xs` | `0 1px 2px rgb(15 23 42 / 0.05)` | Control hoặc card nhẹ |
| `shadow-sm` | `0 2px 8px rgb(15 23 42 / 0.08)` | Dropdown, sticky element |
| `shadow-md` | `0 12px 32px rgb(15 23 42 / 0.14)` | Dialog, popover |

- Card trong dashboard ưu tiên border + `shadow-xs`.
- Không dùng shadow lớn cho mọi card.

### 9.6. Layout dimensions

| Token | Giá trị |
| --- | ---: |
| `sidebar-expanded` | 256px |
| `sidebar-collapsed` | 72px |
| `app-header-height` | 64px |
| `content-max-width` | 1440px |
| `form-max-width` | 760px |
| `detail-main-max-width` | 960px |
| `auth-card-width` | 440px |

### 9.7. Z-index

| Layer | Token | Giá trị |
| --- | --- | ---: |
| Base | `z-base` | 0 |
| Sticky | `z-sticky` | 20 |
| Dropdown / popover | `z-popover` | 40 |
| Mobile drawer backdrop | `z-drawer-backdrop` | 50 |
| Mobile drawer | `z-drawer` | 60 |
| Modal backdrop | `z-modal-backdrop` | 70 |
| Modal | `z-modal` | 80 |
| Toast | `z-toast` | 100 |

Không tự đặt `z-index: 9999` trong component.

## 10. Responsive system

### 10.1. Breakpoints

| Tên | Min width | Thiết bị tham chiếu |
| --- | ---: | --- |
| `xs` | 0px | Mobile nhỏ |
| `sm` | 640px | Mobile lớn |
| `md` | 768px | Tablet |
| `lg` | 1024px | Laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Desktop lớn |

Thiết kế theo mobile-first. Breakpoint là điểm layout cần thay đổi, không phải danh sách model thiết bị.

### 10.2. Hành vi theo viewport

#### Dưới 768px

- Sidebar trở thành drawer và đóng sau khi chọn route.
- Header hiển thị menu button, logo rút gọn, notification và avatar.
- PageHeader xếp title, description và actions theo chiều dọc.
- Primary action full-width khi có lợi cho thao tác.
- Filter đặt trong drawer/sheet nếu có trên ba tiêu chí; filter đơn giản có thể inline.
- Table dữ liệu nghiệp vụ chuyển thành card list hoặc cho phép cuộn ngang nếu cần so sánh cột.
- Form nhiều cột chuyển về một cột.
- Dialog dùng chiều rộng `calc(100vw - 32px)`; flow dài dùng bottom sheet/full-screen dialog.

#### Từ 768px đến dưới 1024px

- Sidebar có thể collapsed mặc định.
- Dashboard metric cards hiển thị hai cột.
- Detail page có thể xếp sidebar metadata xuống dưới nội dung chính.
- Filter bar được phép wrap thành nhiều hàng.

#### Từ 1024px trở lên

- Sidebar cố định bên trái.
- Dashboard metric cards hiển thị 3–4 cột tùy role.
- Ticket detail sử dụng layout hai cột nếu đủ rộng.
- Table hiển thị đầy đủ cột ưu tiên; cột phụ có thể ẩn ở `lg` và xuất hiện ở `xl`.

### 10.3. Quy tắc responsive chung

- Không ẩn action quan trọng mà không có vị trí thay thế.
- Không rút gọn label đến mức khó hiểu.
- Không dùng hover làm cách duy nhất để khám phá chức năng.
- Kiểm tra tối thiểu ở 360px, 768px, 1024px và 1440px.
- Không để horizontal scroll toàn page; chỉ vùng table/code được phép scroll có chủ đích.

## 11. Grid và container

- App content nằm trong container có `max-width: 1440px` và căn giữa.
- Dashboard dùng grid 12 cột trên desktop, 6 cột trên tablet và 1 cột trên mobile.
- Khoảng cách grid mặc định 24px desktop, 16px tablet/mobile.
- Form tạo/sửa không kéo quá rộng; dùng `max-width: 760px` để giữ khả năng đọc.
- Nội dung hội thoại có thể rộng tối đa 960px; metadata panel 300–360px.
- Không dùng fixed width khiến layout vỡ ở mobile.

## 12. Layout system

### 12.1. Auth Layout

Cấu trúc:

- Logo và tên HelpDesk Pro.
- Auth card chứa heading, description, form và liên kết chuyển login/register.
- Optional visual panel chỉ hiển thị từ `lg` trở lên.
- Footer ngắn với copyright hoặc link chính sách nếu project có.

Quy tắc:

- Form luôn là vùng nổi bật nhất.
- Không hiển thị app sidebar/header.
- Auth card rộng tối đa 440px.
- Mobile sử dụng nền đơn giản, card không cần shadow lớn.
- Nếu đã đăng nhập, route auth điều hướng theo role đã xác thực.

### 12.2. App Shell dùng chung

`USER`, `AGENT`, `ADMIN` dùng chung cấu trúc:

```text
AppShell
├── Sidebar / MobileDrawer
├── Header
│   ├── MobileMenuButton
│   ├── ContextTitle hoặc Breadcrumb
│   ├── NotificationMenu
│   └── UserMenu
└── MainContent
    ├── PageHeader
    └── PageBody
```

Không nhân bản ba layout nếu chỉ khác menu. Dùng cấu hình navigation theo role.

### 12.3. Sidebar

- Expanded width: 256px; collapsed width: 72px.
- Logo ở đầu sidebar.
- Menu chia nhóm khi thật sự cần.
- Active item dùng primary foreground + primary-subtle background.
- Collapsed item bắt buộc có tooltip.
- Badge số lượng chỉ dùng cho thông tin hữu ích như ticket chưa xử lý.
- Không hiển thị route trái quyền.
- Nút collapse chỉ xuất hiện trên desktop/tablet phù hợp; mobile dùng drawer.

Navigation đề xuất:

| Role | Menu |
| --- | --- |
| `USER` | Tổng quan, Ticket của tôi, Tạo ticket, Hồ sơ |
| `AGENT` | Tổng quan, Ticket xử lý |
| `ADMIN` | Tổng quan, Ticket, Người dùng, Danh mục |

### 12.4. Header

- Cao 64px, sticky nếu nội dung dài.
- Có border-bottom nhẹ; background không trong suốt gây khó đọc.
- Bên phải gồm NotificationMenu và UserMenu.
- Search toàn hệ thống chỉ thêm khi có yêu cầu nghiệp vụ rõ ràng.
- Avatar có fallback initials.
- User menu gồm tên, email, role label, link profile nếu có và đăng xuất.

### 12.5. PageHeader

Thành phần:

- Breadcrumb khi page nằm sâu hơn một cấp hoặc là detail page.
- `h1` page title.
- Description ngắn, tối đa khoảng hai dòng.
- Primary và secondary actions.

Quy tắc:

- Tối đa một primary action.
- Actions xếp hàng ngang trên desktop, xếp dọc hoặc wrap trên mobile.
- Detail page có back link rõ ràng; không dựa hoàn toàn vào browser back.

## 13. Component foundation

### 13.1. Button

Variants:

- `primary`: tạo mới, lưu, gửi, xác nhận hành động chính.
- `secondary`: hành động quan trọng thứ hai.
- `outline`: filter, action ít nổi bật.
- `ghost`: toolbar, icon action, menu.
- `danger`: xóa, khóa hoặc hủy hành động quan trọng.
- `link`: điều hướng trong văn bản.

Sizes: `sm`, `md`, `lg`, `icon`.

States:

- Default, hover, active, focus-visible, disabled, loading.
- Loading giữ nguyên chiều rộng, hiển thị spinner và text phù hợp.
- Disabled phải có `disabled` thật, không chỉ đổi opacity.
- Icon-only button bắt buộc có `aria-label` và tooltip nếu nghĩa không hiển nhiên.
- Không đặt hai primary button cạnh nhau trong cùng một action group.

### 13.2. Input và Textarea

- Có label, placeholder tùy chọn, helper text và error text.
- Border mặc định, focus ring rõ, error border + message + icon khi phù hợp.
- Không dùng placeholder thay label.
- Readonly phải phân biệt với disabled.
- Password input có nút hiện/ẩn mật khẩu, label accessible.
- Textarea mô tả ticket có character count nếu backend giới hạn độ dài.

### 13.3. Select, Combobox và Multi-select

- `Select` dùng cho danh sách ngắn, cố định.
- `Combobox` dùng khi danh sách dài hoặc cần tìm kiếm, ví dụ chọn assignee.
- Không tải toàn bộ hàng nghìn user vào select.
- Option phải có selected, focused và disabled state rõ ràng.
- Mobile dropdown không được vượt viewport.

### 13.4. Checkbox và Radio

- Checkbox dùng cho lựa chọn độc lập hoặc chọn nhiều hàng.
- Radio dùng khi chỉ chọn một trong các lựa chọn đồng cấp.
- Label click được.
- Không dùng switch cho hành động ngay lập tức có hậu quả lớn.

### 13.5. Badge

Variants semantic: `neutral`, `primary`, `success`, `warning`, `danger`, `info`.

- `StatusBadge` và `PriorityBadge` dùng mapping tập trung.
- Badge không dùng như button nếu không có affordance rõ ràng.
- Text không viết toàn bộ chữ hoa nếu làm giảm khả năng đọc.

### 13.6. Card

Variants:

- `default`: surface + border.
- `interactive`: có hover/focus và toàn card click được đúng semantic.
- `metric`: số liệu dashboard.
- `muted`: vùng thông tin phụ.

Card gồm header, content, footer tùy chọn. Không bọc mọi section trong card nếu hierarchy đã rõ.

### 13.7. Avatar

Sizes: 24, 32, 40, 48px.

- Ưu tiên ảnh hợp lệ; fallback là initials tối đa hai ký tự.
- Có màu nền ổn định theo user ID hoặc neutral token.
- Decorative avatar dùng alt rỗng; avatar mang thông tin phải có accessible name.

### 13.8. Tooltip

- Dùng để bổ sung giải thích ngắn, không chứa nội dung thiết yếu.
- Không thay thế label của form.
- Mở bằng hover và keyboard focus; có delay ngắn khoảng 300–500ms.

### 13.9. Dropdown menu

- Dùng cho action phụ hoặc user menu.
- Destructive item tách nhóm và dùng danger text.
- Hỗ trợ arrow key, Escape và focus management.
- Không giấu primary action quan trọng nhất trong dropdown trên desktop.

### 13.10. Tabs

- Chỉ dùng khi các phần nội dung đồng cấp và có liên quan trực tiếp.
- Active tab rõ ràng, keyboard accessible.
- Nếu tab cần chia sẻ URL hoặc refresh không mất trạng thái, đồng bộ với query param hoặc sub-route.
- Không dùng quá nhiều tab; ưu tiên dưới 5.

### 13.11. Pagination

- Hiển thị page hiện tại, tổng số trang và tổng bản ghi khi API cung cấp.
- Có Previous/Next và page numbers ở desktop.
- Mobile có Previous/Next + `Trang x/y`.
- Page size mặc định 10 hoặc 20 theo `PROJECT_SPEC.md`/API; không tự đặt khác backend.
- Khi filter đổi, quay về page 1.
- Pagination state nên phản ánh trên URL query.

### 13.12. Modal / Dialog

- Dùng cho xác nhận hoặc form ngắn.
- Form dài, detail phức tạp hoặc flow nhiều bước nên dùng page riêng.
- Có title, description, body, footer.
- Focus trap, focus ban đầu hợp lý và trả focus về trigger khi đóng.
- Escape và backdrop có thể đóng dialog thông thường.
- Khi request đang chạy, không cho đóng nếu việc đóng gây trạng thái không rõ ràng.
- Destructive dialog phải nói rõ đối tượng và hậu quả.

### 13.13. Toast

Variants: success, error, warning, info.

- Dùng cho kết quả action không cần chặn luồng.
- Validation error của form phải hiện tại field hoặc form summary, không chỉ toast.
- Error toast tồn tại lâu hơn success toast.
- Không hiển thị nhiều toast trùng cho cùng một request.
- Nội dung ngắn, có thể có action “Thử lại” khi an toàn.

### 13.14. Skeleton

- Mô phỏng gần đúng layout thật để giảm layout shift.
- Không dùng spinner toàn màn hình cho table/card page nếu có thể dùng skeleton.
- Không chạy shimmer quá mạnh; tôn trọng reduced motion.

### 13.15. EmptyState

Gồm:

- Icon hoặc illustration nhẹ.
- Heading ngắn.
- Description giải thích trạng thái.
- Action nếu có bước tiếp theo hợp lý.

Phân biệt:

- Chưa có dữ liệu: ví dụ chưa tạo ticket nào.
- Không có kết quả: do search/filter; action phù hợp là xóa bộ lọc.
- Không có quyền: dùng ForbiddenState, không dùng EmptyState chung.

### 13.16. ErrorState

- Inline error cho vùng dữ liệu nhỏ.
- Full-page error cho page không thể sử dụng.
- Có message dễ hiểu và nút thử lại khi phù hợp.
- Không hiển thị raw error, stack trace hoặc response nhạy cảm.
- Nếu lỗi do session hết hạn, xử lý theo auth flow thay vì chỉ render lỗi chung.

## 14. Component nghiệp vụ HelpDesk

### 14.1. StatusBadge

Props khái niệm:

- `status`: enum ticket status.
- `size`: `sm | md`.
- `showIcon`: boolean.

Component lấy label và màu từ mapping tập trung. Unknown value phải fallback an toàn thành badge trung tính và log theo cơ chế phù hợp, không làm crash page.

### 14.2. PriorityBadge

Tương tự StatusBadge, chỉ nhận priority hợp lệ. `URGENT` nổi bật vừa đủ, không nhấp nháy.

### 14.3. TicketCard

Thông tin ưu tiên:

1. Mã ticket và title.
2. Status + priority.
3. Category.
4. Assignee hoặc requester tùy role.
5. Thời gian cập nhật.

Card phải keyboard accessible. Nếu toàn card điều hướng, action phụ không được tạo nested interactive element sai semantic.

### 14.4. TicketTable

Cột đề xuất:

| Role | Cột chính |
| --- | --- |
| `USER` | Mã, Tiêu đề, Danh mục, Ưu tiên, Trạng thái, Cập nhật |
| `AGENT` | Mã, Tiêu đề, Người gửi, Ưu tiên, Trạng thái, Người phụ trách, Cập nhật |
| `ADMIN` | Mã, Tiêu đề, Người gửi, Danh mục, Ưu tiên, Trạng thái, Agent, Cập nhật |

- Title là link tới detail page.
- Không đặt quá ba icon action trực tiếp trên một hàng.
- Nếu row click được, link title vẫn phải hoạt động rõ ràng và hỗ trợ mở tab mới.
- Trên mobile ưu tiên TicketCard thay cho table bị nén.

### 14.5. FilterBar

Có thể gồm:

- Search theo mã hoặc tiêu đề.
- Status.
- Priority.
- Category.
- Assignee với role phù hợp.
- Date range nếu API hỗ trợ.
- Sort.

Quy tắc:

- Filter đang áp dụng phải nhìn thấy được.
- Có action “Xóa bộ lọc” khi ít nhất một filter khác mặc định.
- Debounce search khoảng 300–500ms hoặc submit rõ ràng; không request mỗi keystroke không kiểm soát.
- Đồng bộ filter vào URL query để back/forward và chia sẻ URL hoạt động.
- Không gửi query mà API không hỗ trợ.

### 14.6. TicketConversation

- Comment hiển thị avatar, tên, role nếu cần, thời gian và nội dung.
- Comment của người đang đăng nhập có thể căn khác nhẹ nhưng không biến thành UI chat consumer quá mức.
- Giữ thứ tự thời gian rõ ràng.
- Timestamp dùng định dạng nhất quán và có full time trong tooltip khi cần.
- Nội dung xuống dòng đúng; link dài không làm vỡ layout.
- Attachment hiển thị tên file, loại, kích thước và action tải/xem theo quyền.

### 14.7. InternalNote

- Chỉ render cho role được phép.
- Visual khác comment công khai bằng nền warning-subtle, icon khóa và label “Ghi chú nội bộ”.
- Không chỉ dựa vào màu để phân biệt.
- Form thêm note phải nói rõ note không hiển thị cho khách hàng.

### 14.8. TicketMetadataPanel

Hiển thị:

- Status.
- Priority.
- Category.
- Requester.
- Assignee.
- Created at.
- Updated at.
- Các action phù hợp quyền.

Desktop có thể sticky trong detail page nhưng không che footer/nội dung. Mobile đặt sau phần summary hoặc trong accordion dễ khám phá.

### 14.9. UserTable

Cột đề xuất:

- Người dùng: avatar, tên, email.
- Role.
- Trạng thái tài khoản nếu có trong spec.
- Ngày tham gia.
- Hoạt động gần nhất nếu API cung cấp.
- Actions.

Không hiển thị dữ liệu bảo mật. Thay đổi role hoặc trạng thái cần confirm phù hợp và không cho admin tự gây khóa sai nếu business rule cấm.

### 14.10. CategoryTable

Cột đề xuất:

- Tên danh mục.
- Mô tả.
- Trạng thái nếu có.
- Số ticket nếu API cung cấp.
- Cập nhật gần nhất.
- Actions.

Không hiển thị metric giả nếu backend chưa cung cấp.

## 15. Forms và validation UX

### 15.1. Cấu trúc field

```text
Label + required indicator
Control
Helper text hoặc constraints
Error message
```

### 15.2. Quy tắc chung

- Label luôn liên kết với control bằng `htmlFor`/`id` hoặc cơ chế tương đương.
- Field bắt buộc có dấu `*` và có giải thích chung “* Bắt buộc” nếu cần.
- Frontend validation dùng cùng giới hạn với API contract nhưng backend vẫn là nguồn xác thực cuối cùng.
- Validate khi blur hoặc submit; không hiển thị lỗi ngay từ ký tự đầu tiên nếu gây khó chịu.
- Khi submit lỗi, focus vào field lỗi đầu tiên hoặc form error summary.
- Không xóa input sau khi submit thất bại.
- Submit button disabled/loading trong khi gửi để tránh gửi trùng.
- Server field error ánh xạ về field phù hợp nếu có thể.
- Unknown server error hiển thị form-level error dễ hiểu.
- Không lưu password hoặc token trong form state lâu hơn cần thiết.

### 15.3. Form tạo ticket

Thứ tự field đề xuất:

1. Tiêu đề.
2. Danh mục.
3. Độ ưu tiên nếu USER được phép chọn theo spec.
4. Mô tả chi tiết.
5. File đính kèm nếu tính năng có trong spec.

UX:

- Có hướng dẫn ngắn để người dùng mô tả vấn đề tốt hơn.
- Title có max length indicator khi gần giới hạn.
- Attachment hiển thị progress, lỗi loại file/kích thước và khả năng xóa trước khi gửi.
- Có `Hủy` và `Gửi yêu cầu`; `Gửi yêu cầu` là primary.
- Nếu người dùng đã nhập dữ liệu rồi rời page, có thể cảnh báo unsaved changes.

### 15.4. Form hồ sơ

- Tách thông tin có thể sửa và thông tin chỉ đọc.
- Email/role readonly nếu không cho tự sửa.
- Nút lưu chỉ active khi dữ liệu thay đổi và hợp lệ, nếu implementation cho phép.
- Đổi mật khẩu chỉ thêm khi có trong scope; không tự ghép vào profile.

## 16. Table và list UX

- Table header sticky chỉ khi table dài và không gây conflict với app header.
- Sortable column có icon và `aria-sort`.
- Loading lần đầu dùng skeleton rows.
- Refresh nền giữ dữ liệu cũ và hiển thị indicator nhỏ, tránh thay toàn table bằng spinner.
- Empty state đặt trong vùng table/list.
- Error state có nút retry.
- Selected rows chỉ dùng khi có bulk action thật.
- Bulk action bar xuất hiện rõ khi có selection.
- Mobile card phải giữ cùng dữ liệu ưu tiên, không đơn giản là ẩn hầu hết cột.
- Dữ liệu ngày giờ dùng cùng formatter.
- Không render `null`, `undefined`, raw enum hoặc raw timestamp cho người dùng.

## 17. Search, filter, sort và URL state

Query parameter gợi ý, phải đối chiếu API thực tế:

```text
?page=1&limit=10&search=...&status=OPEN&priority=HIGH&categoryId=...&sort=-updatedAt
```

Quy tắc:

- URL là nguồn trạng thái cho page, filter, sort khi có lợi cho điều hướng.
- Bỏ query param mặc định không cần thiết để URL gọn.
- Parse và validate query param trước khi dùng.
- Query không hợp lệ fallback về mặc định an toàn.
- Thay search/filter bằng `replace` hoặc `push` có chủ đích để history không bị spam.
- Khi quay lại list từ detail, cố gắng giữ filter, page và vị trí cuộn.

## 18. Feedback và system states

### 18.1. Loading

- Initial page load: skeleton theo cấu trúc page.
- Button action: spinner trong button.
- Background refresh: indicator nhẹ, không khóa toàn page.
- Upload: progress theo file nếu có.
- Không hiển thị nhiều loại loading cạnh tranh nhau.

### 18.2. Success

- Create ticket thành công: toast + điều hướng tới detail hoặc list theo flow đã thống nhất.
- Update status/assignment thành công: cập nhật UI và toast ngắn.
- Save profile thành công: toast; không reload toàn page nếu không cần.
- Không dùng modal chỉ để báo “thành công”.

### 18.3. Error

- Message nói được điều gì thất bại và người dùng có thể làm gì.
- Không đổ lỗi cho người dùng.
- Lỗi validation ở field; lỗi request chung ở form/page; lỗi nền có toast nếu action đã bắt đầu từ người dùng.
- Retry chỉ hiển thị khi thao tác an toàn để lặp lại.

### 18.4. Unauthorized và Forbidden

- `401`: ưu tiên auth flow, refresh session nếu có; nếu thất bại chuyển login và giữ safe return URL.
- `403`: hiển thị page “Bạn không có quyền truy cập” với link về dashboard phù hợp role.
- Không chuyển mọi lỗi quyền thành 404 trừ khi security/business rule yêu cầu che giấu tài nguyên.

### 18.5. Not found

- Có heading rõ, mô tả ngắn và action về dashboard hoặc list.
- Ticket not found phải phân biệt hợp lý với network error.
- Không hiển thị raw ID nhạy cảm trong error message nếu không cần.

## 19. Dialog xác nhận

### 19.1. Hành động cần xác nhận

- Xóa category nếu được phép.
- Khóa/vô hiệu hóa user nếu có.
- Hủy ticket nếu ảnh hưởng rõ ràng.
- Đóng ticket khi không thể dễ dàng mở lại, tùy business rule.
- Rời form có thay đổi chưa lưu.

### 19.2. Nội dung dialog

- Title dùng động từ cụ thể: “Xóa danh mục?” thay vì “Bạn có chắc không?”.
- Description nêu tên đối tượng và hậu quả.
- Nút hủy là secondary/outline.
- Nút xác nhận dùng danger nếu destructive.
- Khi request chạy, giữ dialog mở và hiển thị loading.
- Nếu request lỗi, hiển thị lỗi trong dialog và cho phép thử lại/đóng.

## 20. Icon và hình ảnh

- Chỉ dùng một icon library thống nhất; ưu tiên Lucide nếu project đã có hoặc chưa có lựa chọn khác.
- Kích thước chuẩn: 16px trong compact control, 20px trong button/navigation, 24px cho empty state nhỏ.
- Icon phải dùng `currentColor` để theo semantic color.
- Không dùng emoji thay icon chức năng.
- Illustration chỉ dùng cho auth/empty state và phải nhẹ, không lấn át nội dung.
- Ảnh có `width`/`height` hoặc aspect ratio để tránh layout shift.
- Avatar fallback luôn tồn tại.

## 21. Motion và transition

| Token | Thời gian | Sử dụng |
| --- | ---: | --- |
| `motion-fast` | 150ms | Hover, focus, color |
| `motion-normal` | 200ms | Dropdown, tooltip |
| `motion-slow` | 250ms | Drawer, dialog |

- Easing mặc định: `cubic-bezier(0.2, 0, 0, 1)`.
- Animation phải giải thích thay đổi trạng thái hoặc lớp giao diện.
- Không animation số liệu, badge hoặc table gây phân tâm.
- `prefers-reduced-motion: reduce` phải tắt hoặc rút ngắn motion không thiết yếu.
- Không trì hoãn action chỉ để chờ animation.

## 22. Accessibility

Mục tiêu tối thiểu: WCAG 2.1 AA cho các luồng chính.

### 22.1. Semantic và structure

- Dùng `header`, `nav`, `main`, `section`, `form`, `table`, `button`, `a` đúng nghĩa.
- Không dùng `div` click thay button/link.
- Heading theo thứ tự hợp lý.
- Có skip link tới main content.
- Mỗi page có title trình duyệt phù hợp.

### 22.2. Keyboard

- Mọi interactive element sử dụng được bằng bàn phím.
- Tab order theo thứ tự hình ảnh và logic.
- Focus visible rõ, không xóa outline nếu không có thay thế.
- Escape đóng popup/dialog phù hợp.
- Menu, listbox, tabs tuân theo keyboard pattern của component library.

### 22.3. Form

- Tất cả field có accessible name.
- Error liên kết qua `aria-describedby` hoặc cơ chế tương đương.
- Required/invalid state được thông báo cho assistive technology.
- Không chỉ dùng màu đỏ để báo lỗi.

### 22.4. Color và contrast

- Text thường đạt contrast tối thiểu 4.5:1.
- Text lớn đạt tối thiểu 3:1.
- Border/focus indicator quan trọng đủ rõ trên nền.
- Status và priority luôn có label.

### 22.5. Live region

- Toast và async feedback quan trọng dùng live region phù hợp.
- Không announce liên tục khi search debounce.
- Loading status có text accessible khi cần.

## 23. Content design và microcopy

### 23.1. Ngôn ngữ

- Phiên bản hiện tại dùng tiếng Việt thống nhất.
- Tên enum kỹ thuật không hiển thị trực tiếp.
- Dùng câu ngắn, rõ, chủ động.
- Button bắt đầu bằng động từ: “Tạo ticket”, “Lưu thay đổi”, “Gửi phản hồi”.
- Không trộn `Ticket của tôi` với `Yêu cầu của tôi` tùy tiện; chọn một thuật ngữ chính. Tài liệu này ưu tiên “ticket” vì tên miền sản phẩm hiện tại, nhưng có thể đổi toàn hệ thống theo yêu cầu.

### 23.2. Date/time

- Format hiển thị đề xuất: `dd/MM/yyyy HH:mm`.
- Timestamp gần có thể hiển thị tương đối như “5 phút trước”, nhưng tooltip hoặc detail cho biết thời gian tuyệt đối.
- Dùng timezone nhất quán theo cấu hình sản phẩm/người dùng.
- Không format ngày rải rác trong component; dùng helper chung.

### 23.3. Số và count

- Dùng formatter chung.
- Số 0 phải hiển thị là 0, không nhầm thành empty.
- Metric chưa có dữ liệu hiển thị placeholder có nghĩa, không tự biến thành 0 nếu 0 làm sai ý nghĩa.

## 24. Đặc tả từng page

### 24.1. Login — `/login`

Mục tiêu: giúp người dùng đăng nhập nhanh và hiểu lỗi rõ ràng.

Cấu trúc:

1. Logo + tên sản phẩm.
2. Heading “Đăng nhập”.
3. Description ngắn.
4. Email field.
5. Password field + show/hide.
6. Forgot password link chỉ xuất hiện nếu route/tính năng tồn tại.
7. Submit button.
8. Link sang `/register`.

States:

- Validation field.
- Sai thông tin đăng nhập: form-level error, không tiết lộ tài khoản có tồn tại hay không nếu security rule yêu cầu.
- Rate limit: message dễ hiểu, hướng dẫn thử lại sau.
- Loading trong submit button.
- Nếu login thành công, điều hướng dashboard theo role.

Responsive:

- Mobile: form full-width trong padding 16px.
- Desktop: card 440px; visual panel tùy chọn không cản form.

### 24.2. Register — `/register`

Mục tiêu: tạo tài khoản `USER` theo business rule.

Cấu trúc đề xuất:

1. Họ tên.
2. Email.
3. Password.
4. Confirm password.
5. Điều khoản nếu project yêu cầu.
6. Submit.
7. Link về login.

Quy tắc:

- Không cho chọn role ở form public.
- Hiển thị yêu cầu password trước hoặc khi focus.
- Confirm password validate ở client; backend xử lý dữ liệu chính.
- Thành công chuyển theo auth flow trong spec, không tự giả định auto-login nếu chưa xác nhận.

### 24.3. USER Dashboard — `/dashboard`

Mục tiêu: cho USER biết tình trạng hỗ trợ và bước tiếp theo.

PageHeader:

- Greeting ngắn hoặc title “Tổng quan”.
- Primary action “Tạo ticket”.

Sections đề xuất:

1. Metric cards: tổng ticket, đang xử lý, chờ phản hồi, đã giải quyết.
2. Ticket gần đây.
3. Vùng cần hành động: ticket đang chờ USER phản hồi, nếu API hỗ trợ.
4. Quick action tạo ticket.

Không hiển thị chart nếu không làm rõ thông tin. Metric phải đến từ API, không tính sai bằng một page dữ liệu phân trang.

Empty state: hướng dẫn tạo ticket đầu tiên.

### 24.4. USER Ticket List — `/tickets`

Mục tiêu: tìm và theo dõi ticket của chính USER.

PageHeader:

- Title “Ticket của tôi”.
- Description ngắn.
- Primary action “Tạo ticket”.

Content:

1. Search + filters status, priority, category nếu API hỗ trợ.
2. TicketTable desktop / TicketCard list mobile.
3. Pagination.

Empty states:

- Chưa có ticket: CTA tạo ticket.
- Không có kết quả filter: CTA xóa bộ lọc.

Không hiển thị ticket của người khác dù client state có dữ liệu lỗi; backend vẫn phải bảo vệ quyền.

### 24.5. Create Ticket — `/tickets/new`

Mục tiêu: gửi yêu cầu hỗ trợ đầy đủ nhưng không gây quá tải.

PageHeader:

- Breadcrumb `Ticket của tôi / Tạo ticket`.
- Title “Tạo ticket mới”.
- Description hướng dẫn ngắn.

Content:

- Form trong container tối đa 760px.
- Field theo mục 15.3.
- Vùng action sticky trên mobile chỉ dùng khi form dài và không che input.

Sau thành công:

- Hiển thị toast.
- Điều hướng theo flow đã thống nhất, ưu tiên detail ticket mới để người dùng thấy kết quả.

### 24.6. USER Ticket Detail — `/tickets/[id]`

Mục tiêu: xem toàn bộ tiến độ và trao đổi về một ticket.

PageHeader:

- Back link về danh sách.
- Ticket ID + title.
- StatusBadge và PriorityBadge.

Desktop layout:

- Main column: mô tả gốc, conversation, attachment, reply form.
- Side column: metadata và các action USER được phép.

Mobile layout:

- Header → metadata summary → description → conversation → reply form.

States:

- Loading skeleton tương ứng hai cột.
- 404/403 rõ ràng theo policy.
- Closed ticket: reply form disabled/ẩn theo business rule, có giải thích.
- Internal note tuyệt đối không render cho USER.

### 24.7. Profile — `/profile`

Mục tiêu: xem và cập nhật thông tin cá nhân được phép.

Sections:

1. Avatar + identity summary.
2. Personal information form.
3. Account information readonly như email/role nếu spec quy định.
4. Security section chỉ khi có tính năng tương ứng.

- Không trộn setting toàn hệ thống vào profile.
- Có success/error feedback rõ.

### 24.8. AGENT Dashboard — `/staff/dashboard`

Mục tiêu: giúp AGENT ưu tiên ticket cần xử lý.

Sections đề xuất:

1. Metric: ticket được giao, đang xử lý, chờ USER, quá hạn nếu SLA có trong spec.
2. Queue “Cần xử lý tiếp”.
3. Ticket mới hoặc chưa phân công mà AGENT được phép nhận.
4. Recent activity nếu API hỗ trợ.

Primary action chỉ xuất hiện nếu có hành động rõ ràng, ví dụ “Xem hàng đợi”. Không dùng chart trang trí.

### 24.9. AGENT Ticket List — `/staff/tickets`

Mục tiêu: quản lý queue và ticket được giao.

Tabs/filter có thể gồm:

- Được giao cho tôi.
- Chưa phân công.
- Tất cả được phép xem.

Chỉ dùng tabs này khi business rule/API hỗ trợ. Nếu không, dùng filter assignee.

Content:

- Search.
- Filter status, priority, category, assignee/scope.
- Sort theo cập nhật, độ ưu tiên hoặc SLA khi có.
- Table/card + pagination.

Các action nhanh như nhận ticket chỉ hiển thị nếu được phép và phải xử lý race condition bằng phản hồi từ server.

### 24.10. AGENT Ticket Detail — `/staff/tickets/[id]`

Mục tiêu: xử lý ticket trong một workspace rõ ràng.

Desktop layout:

- Main: ticket description, public conversation, internal notes, reply composer.
- Sidebar: metadata, assignment, status, priority, category và actions.

Composer:

- Chọn rõ “Phản hồi khách hàng” hoặc “Ghi chú nội bộ”.
- Hai chế độ khác visual mạnh và có label persistent.
- Không giữ nội dung internal note khi chuyển nhầm sang public reply mà không cảnh báo.

Action:

- Nhận ticket.
- Phân công nếu role được phép.
- Chuyển trạng thái theo transitions hợp lệ.
- Cập nhật priority/category nếu được phép.

UI chỉ hiển thị action từ permission + current state; server là nguồn xác thực cuối cùng.

### 24.11. ADMIN Dashboard — `/admin/dashboard`

Mục tiêu: theo dõi sức khỏe vận hành hệ thống.

Sections đề xuất:

1. Tổng ticket.
2. Ticket đang mở/đang xử lý.
3. Ticket đã giải quyết trong khoảng thời gian.
4. Ticket chưa phân công.
5. Distribution theo status hoặc priority nếu dữ liệu hỗ trợ.
6. Recent tickets.
7. Agent workload nếu có API và có ý nghĩa.

Chart phải có title, legend, accessible summary và empty state. Không tạo chart từ dữ liệu giả.

### 24.12. ADMIN Ticket List — `/admin/tickets`

Mục tiêu: quan sát và quản trị toàn bộ ticket.

Content:

- Search và filter đầy đủ theo API.
- TicketTable với requester, assignee, category, status, priority.
- Pagination.
- Bulk action chỉ khi business rule yêu cầu và bảo đảm an toàn.

Admin không đồng nghĩa bỏ qua xác nhận cho destructive action.

### 24.13. ADMIN Ticket Detail — `/admin/tickets/[id]`

Mục tiêu: xem và can thiệp theo quyền quản trị.

- Dùng cùng TicketDetail foundation với AGENT.
- Có thể có thêm assignment/override action theo spec.
- Phải giữ lịch sử/hậu quả rõ ràng nếu admin thay đổi trạng thái hoặc assignee.
- Không nhân bản toàn page chỉ để thêm vài action; dùng permission-based composition.

### 24.14. User Management — `/admin/users`

Mục tiêu: tìm kiếm và quản lý USER/AGENT/ADMIN theo quyền.

PageHeader:

- Title “Quản lý người dùng”.
- Action tạo user/agent chỉ khi tính năng có trong spec.

Content:

- Search theo tên/email.
- Filter role và trạng thái nếu có.
- UserTable desktop / UserCard mobile.
- Pagination.
- Action menu theo từng user.

Dialog edit/role:

- Hiển thị đối tượng rõ.
- Không cho người dùng public tự chọn role.
- Role change cần xác nhận nếu ảnh hưởng quyền lớn.
- Không render password hoặc token.

### 24.15. Category Management — `/admin/categories`

Mục tiêu: quản lý danh mục dùng khi tạo/phân loại ticket.

Content:

- Search nếu danh mục nhiều.
- CategoryTable hoặc card list.
- Create/edit dùng dialog nếu form ngắn; page riêng nếu sau này phức tạp.
- Delete/deactivate theo business rule.

Form:

- Tên.
- Mô tả.
- Trạng thái nếu có.

Nếu category đang được sử dụng, UI phải hiển thị lỗi/hậu quả từ server rõ ràng; không tự giả định có thể xóa.

## 25. Dashboard visualization rules

- Chỉ dùng chart khi người dùng cần so sánh xu hướng, phân bố hoặc workload.
- Metric cards phù hợp hơn khi chỉ cần một con số hiện tại.
- Không dùng pie/donut cho quá nhiều category.
- Bar chart dùng cho so sánh status/category; line chart dùng cho xu hướng theo thời gian.
- Màu chart dựa trên semantic/palette token và đủ phân biệt.
- Tooltip format ngày/số nhất quán.
- Có text summary hoặc table thay thế cho thông tin quan trọng.
- Loading, empty và error state của chart phải có kích thước ổn định.

## 26. Notifications

Nếu notification feature đã có trong `PROJECT_SPEC.md`:

- Bell icon có badge số unread, giới hạn hiển thị `99+`.
- Dropdown hiển thị danh sách ngắn; notification center riêng chỉ thêm khi có route trong spec.
- Item gồm loại, nội dung ngắn, timestamp và unread state.
- Click điều hướng tới tài nguyên đúng quyền.
- Mark as read phải có optimistic UI chỉ khi có rollback khi lỗi.
- Empty state ngắn gọn.
- Realtime update không được làm mất focus hoặc đẩy layout bất ngờ.

Nếu notification chưa có API, không mock tính năng như đã hoạt động.

## 27. Authentication và permission UX

- Route protection phải xảy ra trước hoặc trong quá trình render phù hợp, tránh flash nội dung trái quyền.
- Navigation được tạo từ role/permission đã xác thực.
- Không chỉ ẩn button bằng CSS; component trái quyền không nên được render.
- Session hết hạn: thử refresh theo auth contract; nếu thất bại chuyển login.
- Return URL chỉ chấp nhận đường dẫn nội bộ an toàn.
- Logout hiển thị loading ngắn, xóa client state nhạy cảm và điều hướng login.
- Không hiển thị token trong UI, URL hoặc log client.

## 28. Data fetching và UI consistency

- Page phải phân biệt initial loading và refetching.
- Cache key/query key phải chứa filter, pagination và scope liên quan.
- Sau mutation, cập nhật/invalidate đúng dữ liệu; không reload toàn ứng dụng nếu không cần.
- Optimistic update chỉ dùng khi có rollback và conflict thấp.
- Status transition, assignment và destructive action ưu tiên xác nhận server trước khi coi là hoàn tất.
- API error được chuẩn hóa trước khi đưa vào component.
- UI không phụ thuộc vào raw response wrapper ở quá nhiều nơi; dùng data access layer/adapter phù hợp.

## 29. File và folder conventions

Cấu trúc tham chiếu cho Next.js App Router; phải điều chỉnh theo code hiện có, không di chuyển hàng loạt chỉ để giống tài liệu.

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (user)/
│   │   ├── dashboard/
│   │   ├── tickets/
│   │   └── profile/
│   ├── staff/
│   └── admin/
├── components/
│   ├── ui/
│   ├── shared/
│   └── layouts/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── tickets/
│   ├── users/
│   ├── categories/
│   └── notifications/
├── hooks/
├── lib/
├── services/
├── types/
├── constants/
└── styles/
```

### 29.1. Trách nhiệm

- `app`: routing, layouts, page composition, loading/error boundaries.
- `components/ui`: primitive UI không chứa business rule.
- `components/shared`: component dùng qua nhiều feature như PageHeader, EmptyState.
- `components/layouts`: AppShell, Sidebar, Header, AuthLayout.
- `features`: UI và logic theo domain.
- `services`: API client hoặc integration layer.
- `types`: type dùng chung; type feature-specific ưu tiên đặt gần feature.
- `constants`: mapping dùng chung như route, role, ticket status metadata.
- `styles`: token và global style nếu architecture yêu cầu.

### 29.2. Server và client component

- Server Component là mặc định trong App Router.
- Chỉ dùng `"use client"` khi cần state, effect, event handler, context hoặc browser API.
- Không đặt `"use client"` ở layout/page cấp cao chỉ vì một component con tương tác.
- Tách interactive island để giảm client bundle.
- Không truyền dữ liệu không serializable từ server sang client.

## 30. Naming conventions

| Loại | Quy ước | Ví dụ |
| --- | --- | --- |
| Component | PascalCase | `TicketTable.tsx` |
| Hook | camelCase, bắt đầu `use` | `useTicketFilters.ts` |
| Utility | camelCase | `formatTicketStatus.ts` |
| Service file | kebab-case hoặc convention hiện có, thống nhất | `tickets.service.ts` |
| Type/interface | PascalCase | `TicketListItem` |
| Constant | UPPER_SNAKE_CASE | `TICKET_STATUS_META` |
| Route segment | kebab-case | `forgot-password` |
| CSS variable | kebab-case có semantic prefix | `--color-surface-muted` |
| Test | cùng tên file + suffix | `TicketTable.test.tsx` |

- Không dùng tên mơ hồ như `data`, `item`, `box`, `handleClick` khi phạm vi không đủ rõ.
- Event handler mô tả hành động: `handleStatusChange`, `handleTicketSubmit`.
- Boolean dùng prefix `is`, `has`, `can`, `should`.
- Không viết tắt khó hiểu; `ticket`, `category`, `notification` viết đầy đủ.

## 31. Styling conventions

- Dùng hệ thống styling hiện có của project; nếu dùng Tailwind, tiếp tục dùng Tailwind + CSS variables.
- Không trộn nhiều giải pháp styling nếu không có lý do.
- Class lặp lại và phức tạp nên được đóng gói trong component/variant.
- Dùng utility merge helper hiện có cho conditional class.
- Không viết inline style cho giá trị thuộc design system.
- Dynamic style hợp lệ cho giá trị runtime như progress width nhưng vẫn phải validate.
- Responsive class theo mobile-first.
- Không dùng arbitrary value khi token phù hợp đã tồn tại.
- Không dùng `!important` để vá hierarchy trừ trường hợp tích hợp bên thứ ba có lý do được ghi rõ.

## 32. Component API conventions

- Component primitive không biết role, API endpoint hoặc business enum nếu không phải component domain.
- Ưu tiên composition thay vì prop boolean chồng chéo.
- Props có type rõ; không dùng `any`.
- Variant dùng union hoặc variant utility thống nhất.
- `className` có thể cho phép mở rộng có kiểm soát.
- Forward ref chỉ khi cần tương tác DOM/library.
- Controlled/uncontrolled behavior phải rõ.
- Callback đặt tên theo event/action.
- Không fetch dữ liệu trong component UI primitive.
- Không hard-code text nghiệp vụ trong component tái sử dụng nếu text phụ thuộc context.

## 33. Error boundary và Next.js states

Với App Router, sử dụng phù hợp:

- `loading.tsx`: skeleton theo segment.
- `error.tsx`: recoverable segment error + retry.
- `not-found.tsx`: tài nguyên không tồn tại.
- Global error chỉ cho lỗi cấp ứng dụng.

Quy tắc:

- Không dùng cùng một spinner cho mọi route.
- Error boundary không hiển thị stack trace.
- Retry phải gọi reset/cơ chế phù hợp.
- Auth/permission error không được nuốt thành generic error nếu có thể xử lý chính xác.

## 34. Performance UX

- Dùng `next/image` cho ảnh phù hợp.
- Lazy load chart, editor hoặc dialog nặng khi cần.
- Không tải data của tab chưa mở nếu không cần.
- Tránh client component cấp cao làm tăng bundle.
- Giữ layout ổn định bằng skeleton và kích thước media xác định.
- Search debounce và cancel request cũ khi phù hợp.
- Table lớn dùng server-side pagination; không tải toàn bộ rồi phân trang client.
- Không hy sinh accessibility hoặc độ rõ chỉ để đạt animation mượt.

## 35. Security trong UI

- Không render HTML từ người dùng nếu chưa sanitize theo giải pháp đã chọn.
- Nội dung comment/mô tả mặc định render dưới dạng text an toàn.
- Link ngoài dùng thuộc tính an toàn phù hợp.
- File upload kiểm tra extension/MIME/size ở client để UX tốt, nhưng backend vẫn xác thực.
- Không lưu access/refresh token theo cách trái `PROJECT_SPEC.md`.
- Không log token, password, cookie hoặc payload nhạy cảm.
- Không dựa vào frontend để bảo vệ authorization.
- Không hiển thị internal note, admin-only metadata hoặc action trái quyền.

## 36. Testing UI bắt buộc

### 36.1. Component tests

Ưu tiên kiểm tra:

- Button loading/disabled.
- Form label, validation và submit.
- StatusBadge/PriorityBadge mapping.
- EmptyState/ErrorState.
- Dialog keyboard/focus.
- TicketTable/TicketCard theo role.

### 36.2. Page/integration tests

- Login success/error.
- Register validation.
- Create ticket.
- Ticket list filter/pagination.
- USER không thấy internal note.
- AGENT phân biệt public reply/internal note.
- Permission-based actions.
- Loading, empty, error và not-found states.

### 36.3. Responsive và accessibility checks

- Keyboard-only flow cho login, create ticket và xử lý ticket.
- Focus visible và dialog focus trap.
- Mobile 360px không overflow.
- Tablet và desktop layout đúng.
- Contrast và accessible name cho icon buttons.

## 37. Definition of Done cho UI

Một page/component chỉ được coi là hoàn thành khi:

- Đúng business rule và permission từ `PROJECT_SPEC.md`.
- Đúng token, spacing, typography và component convention trong tài liệu này.
- Hoạt động trên mobile, tablet và desktop.
- Có loading, empty, error và success state phù hợp.
- Dùng keyboard được và có focus state rõ.
- Không render raw enum, raw error hoặc dữ liệu nhạy cảm.
- Không hard-code dữ liệu giả trong production UI.
- Tái sử dụng component hiện có hợp lý.
- Không tạo duplicate component không cần thiết.
- Không làm hỏng route/feature ngoài phạm vi.
- Chạy format, lint, type-check/build và test liên quan thành công theo `AGENTS.md`.

## 38. Checklist review từng page

### Structure

- [ ] Có đúng một `h1`.
- [ ] PageHeader và breadcrumb đúng context.
- [ ] Primary action rõ và không bị lặp.
- [ ] Layout không overflow ở 360px.

### Data states

- [ ] Initial loading.
- [ ] Background refreshing nếu có.
- [ ] Empty state.
- [ ] No-results state.
- [ ] Error + retry hợp lý.
- [ ] 401/403/404 được xử lý đúng.

### Forms/actions

- [ ] Label và error association đầy đủ.
- [ ] Submit loading chống gửi trùng.
- [ ] Dữ liệu không mất khi request lỗi.
- [ ] Destructive action có confirm.
- [ ] Success/error feedback rõ.

### Accessibility

- [ ] Keyboard navigation.
- [ ] Focus visible.
- [ ] Icon button có accessible name.
- [ ] Color contrast đủ.
- [ ] Không truyền thông tin chỉ bằng màu.

### Code quality

- [ ] Không raw color/design value lặp lại.
- [ ] Không raw enum label rải rác.
- [ ] Không business logic trong UI primitive.
- [ ] Không `any` không cần thiết.
- [ ] Không `"use client"` ở phạm vi rộng không cần thiết.

## 39. Lộ trình triển khai design system

Nếu frontend chưa có design system hoàn chỉnh, triển khai theo thứ tự:

1. Chuẩn hóa CSS variables và global typography.
2. Chuẩn hóa Button, Input, Select, Badge, Card, Dialog và Toast.
3. Xây AppShell, AuthLayout, Sidebar, Header và PageHeader.
4. Xây StatusBadge, PriorityBadge, EmptyState, ErrorState và Skeleton.
5. Xây TicketCard, TicketTable, FilterBar và Pagination.
6. Hoàn thiện auth pages.
7. Hoàn thiện USER pages.
8. Hoàn thiện AGENT pages.
9. Hoàn thiện ADMIN pages.
10. Kiểm tra responsive, accessibility, loading/error states và consistency.

Mỗi giai đoạn phải giữ project có thể build và không tự ý thay đổi API contract.

## 40. Những điều không được làm

- Không tạo màu mới tùy ý trong từng page.
- Không hiển thị raw enum như `WAITING_FOR_USER` cho người dùng.
- Không dùng emoji làm icon chức năng.
- Không dùng placeholder thay label.
- Không dùng modal cho form dài/phức tạp.
- Không đặt mọi action trong dropdown.
- Không để table vỡ layout mobile.
- Không chỉ dùng spinner cho mọi trạng thái tải.
- Không chỉ dùng toast cho validation error.
- Không render action trái quyền rồi chỉ disable bằng CSS.
- Không nhân bản page detail cho từng role nếu có thể composition theo permission.
- Không thêm chart, search toàn hệ thống hoặc route mới khi chưa có dữ liệu/yêu cầu.
- Không sao chép business rule từ `PROJECT_SPEC.md` vào tài liệu này nếu có nguy cơ lệch về sau.

## 41. Ghi chú duy trì tài liệu

- Cập nhật `DESIGN.md` khi thêm page, component foundation, token hoặc thay đổi UX chung.
- Thay đổi business rule phải cập nhật `PROJECT_SPEC.md`, không chỉ sửa tại đây.
- Khi thêm route mới, cập nhật cả danh sách route và đặc tả page liên quan.
- Khi đổi token, kiểm tra toàn bộ component sử dụng semantic token.
- Mọi ngoại lệ có chủ đích phải được ghi rõ lý do và phạm vi.
- Không duy trì hai quy chuẩn khác nhau cho cùng một component.

---

Tài liệu này là baseline thiết kế frontend HelpDesk Pro. Khi code hiện tại khác với baseline, cần đánh giá ảnh hưởng và refactor theo từng giai đoạn; không sửa hàng loạt hoặc thay đổi business behavior chỉ để khớp tài liệu.
