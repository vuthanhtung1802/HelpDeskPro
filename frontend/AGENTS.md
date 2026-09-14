# AGENTS.md — HelpDesk Pro Frontend

## 1. Phạm vi áp dụng

File này áp dụng cho toàn bộ mã nguồn frontend HelpDesk Pro nằm trong thư mục chứa file và mọi thư mục con.

Frontend sử dụng Next.js App Router và TypeScript. Mục tiêu là xây dựng giao diện ổn định, dễ đọc, dễ kiểm thử, dễ mở rộng và phù hợp để bảo trì lâu dài.

Khi làm việc trong repository này, agent phải đọc file này trước khi phân tích, tạo mới, sửa hoặc refactor code.

## 2. Thứ tự ưu tiên và nguồn sự thật

Khi có nhiều chỉ dẫn, áp dụng theo thứ tự sau:

1. Yêu cầu trực tiếp, mới nhất của người dùng.
2. `AGENTS.md` gần file đang sửa nhất.
3. `AGENTS.md` tại thư mục gốc frontend.
4. `PROJECT_SPEC.md` hoặc tài liệu đặc tả nghiệp vụ.
5. Cấu trúc và quy ước đang được sử dụng nhất quán trong codebase.

Phân chia trách nhiệm tài liệu:

- `PROJECT_SPEC.md` mô tả sản phẩm: vai trò, chức năng, luồng nghiệp vụ, dữ liệu và tiêu chí chấp nhận.
- `AGENTS.md` mô tả cách agent làm việc: kiến trúc frontend, quy tắc code, refactor, kiểm tra và báo cáo.
- `package.json` cùng lockfile là nguồn sự thật về phiên bản, package manager và các câu lệnh có sẵn.
- API contract, OpenAPI/Swagger hoặc type được sinh từ backend là nguồn sự thật về endpoint và cấu trúc request/response.

Nếu tài liệu mâu thuẫn với code hoặc API hiện tại, không tự ý đoán và không âm thầm thay đổi nghiệp vụ. Hãy nêu rõ điểm mâu thuẫn, giữ thay đổi trong phạm vi an toàn và hỏi lại khi quyết định có thể ảnh hưởng hành vi hệ thống.

## 3. Bối cảnh nghiệp vụ bắt buộc giữ nguyên

HelpDesk Pro là hệ thống quản lý yêu cầu hỗ trợ bằng ticket với ba vai trò:

- `CUSTOMER`: tạo và xem ticket của mình, bình luận, đính kèm file, đóng hoặc mở lại ticket và đánh giá kết quả hỗ trợ khi nghiệp vụ cho phép.
- `STAFF`: xem ticket được phân công, trao đổi với khách hàng và cập nhật quá trình xử lý trong phạm vi được cấp quyền.
- `ADMIN`: xem toàn bộ ticket, phân công nhân viên, quản lý người dùng, danh mục, SLA và dashboard.

Các trạng thái thường gặp gồm `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` và `REOPENED`. Backend là nguồn quyết định cuối cùng về tên trạng thái và chuyển trạng thái hợp lệ; frontend không được tự phát minh trạng thái hoặc bỏ qua quy tắc backend.

Ẩn nút hoặc route theo vai trò chỉ là bảo vệ trải nghiệm người dùng, không phải bảo mật. Backend vẫn phải kiểm tra xác thực và phân quyền cho mọi thao tác.

## 4. Nguyên tắc làm việc chung

- Trước khi sửa code, phải đọc cấu trúc thư mục, `package.json`, lockfile, cấu hình TypeScript, ESLint và các file liên quan trực tiếp.
- Hiểu luồng hiện tại trước khi refactor. Không thay thế một phần chỉ vì có cách viết khác.
- Giữ nguyên giao diện, hành vi, URL, query parameter, API contract và quyền truy cập nếu yêu cầu không nói rõ cần thay đổi.
- Chỉ sửa những file cần thiết cho yêu cầu. Không mở rộng phạm vi sang backend hoặc phần không liên quan.
- Không thêm dependency khi thư viện hiện có đã giải quyết được vấn đề. Nếu thật sự cần package mới, phải giải thích lý do và ảnh hưởng trước khi thêm.
- Dùng đúng package manager theo lockfile hiện có. Không tạo thêm lockfile của package manager khác.
- Không sửa trực tiếp file được sinh tự động. Hãy sửa nguồn sinh file rồi chạy lại công cụ tương ứng.
- Không để secret, token, mật khẩu hoặc URL nội bộ trong source code, log, fixture hay tài liệu ví dụ.
- Không xóa hoặc ghi đè thay đổi chưa liên quan của người dùng.
- Không để lại `console.log`, code chết, import thừa, component không dùng hoặc comment tạm sau khi hoàn thành.

## 5. Kiến trúc thư mục mục tiêu

Ưu tiên cấu trúc feature-first sau, nhưng phải chuyển đổi dần nếu codebase hiện tại đang dùng cấu trúc khác:

```text
src/
├── app/                         # Route, layout, loading, error, not-found
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/                     # Chỉ dùng khi frontend thực sự cần route handler/BFF
├── features/
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── utils/
│   ├── tickets/
│   ├── users/
│   ├── categories/
│   └── dashboard/
├── components/
│   ├── ui/                      # Thành phần UI dùng chung, không chứa nghiệp vụ
│   └── layout/                  # Header, sidebar, navigation...
├── hooks/                       # Hook dùng chung giữa nhiều feature
├── lib/
│   ├── api/                     # HTTP client, error mapping, shared API helpers
│   ├── auth/
│   ├── constants/
│   └── utils/
├── providers/                   # Query, theme, socket và provider toàn ứng dụng
├── types/                       # Kiểu dùng chung toàn ứng dụng
└── config/                      # Cấu hình runtime đã được kiểm tra hợp lệ
```

Quy tắc phụ thuộc:

- `app` được phép ghép feature thành route nhưng không chứa nghiệp vụ phức tạp.
- Một feature sở hữu component, hook, schema, API và type chỉ dùng cho feature đó.
- `components/ui` không được import từ `features`.
- Code dùng chung chỉ được đưa ra ngoài feature khi có ít nhất hai nơi sử dụng thực tế hoặc có lý do kiến trúc rõ ràng.
- Tránh barrel file `index.ts` quá lớn hoặc tạo import vòng. Ưu tiên import trực tiếp khi giúp quan hệ phụ thuộc rõ ràng hơn.
- Không tạo các thư mục chung mơ hồ như `common`, `misc` hoặc `helpers` nếu có thể đặt tên theo đúng trách nhiệm.

## 6. Quy tắc Next.js App Router

- Mặc định dùng Server Component. Chỉ thêm `'use client'` khi component cần state phía client, effect, event handler, browser API hoặc client-only library.
- Đặt `'use client'` ở component nhỏ nhất cần tương tác; không biến cả page hoặc layout thành Client Component nếu không cần.
- `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` và route group chỉ điều phối giao diện và dữ liệu ở cấp route.
- Không import module chỉ chạy phía server vào Client Component.
- Không dùng browser API trong quá trình server render. Nếu cần, truy cập trong Client Component tại thời điểm phù hợp.
- Dùng `next/link`, `next/image`, Metadata API và cơ chế điều hướng của App Router khi phù hợp.
- Không gọi API nội bộ qua vòng HTTP từ Server Component nếu có thể gọi trực tiếp lớp server an toàn và việc đó phù hợp với kiến trúc hiện tại.
- `middleware` chỉ hỗ trợ redirect và trải nghiệm truy cập. Không coi middleware là lớp phân quyền duy nhất.
- Khi dùng `searchParams`, dynamic route hoặc cache/revalidation, phải giữ hành vi hiện có và ghi rõ lựa chọn cache khi nó ảnh hưởng độ mới của dữ liệu.

## 7. TypeScript và quy ước code

- Giữ TypeScript ở chế độ strict nếu dự án đã bật; không làm yếu cấu hình để né lỗi.
- Không dùng `any`. Ưu tiên type cụ thể; dùng `unknown` và type guard khi dữ liệu chưa đáng tin cậy.
- Tách rõ entity, API request, API response, form values và component props khi chúng không hoàn toàn giống nhau.
- Không ép kiểu bằng `as` chỉ để che lỗi. Phải kiểm tra hoặc chuyển đổi dữ liệu tại boundary.
- Component và type/interface dùng PascalCase; function và biến dùng camelCase; hằng số toàn cục dùng UPPER_SNAKE_CASE khi phù hợp; custom hook bắt đầu bằng `use`.
- Dùng tên file `kebab-case`; giữ các tên đặc biệt của Next.js như `page.tsx` và `layout.tsx`.
- Ưu tiên named export cho code ứng dụng; chỉ dùng default export tại nơi framework yêu cầu hoặc codebase đã có quy ước rõ ràng.
- Hàm và component phải có một trách nhiệm chính. Tách khi một khối vừa tải dữ liệu, xử lý nghiệp vụ và render nhiều vùng giao diện độc lập.
- Tránh abstraction sớm, component “đa năng” với quá nhiều boolean prop và utility chỉ được gọi một lần mà không làm code rõ hơn.
- Không dùng `eslint-disable`, `@ts-ignore` hoặc `@ts-expect-error` trừ khi có lý do kỹ thuật cụ thể và comment giải thích ngắn gọn.
- Không tối ưu bằng `useMemo`, `useCallback` hoặc `memo` theo thói quen; chỉ dùng khi có vấn đề đo được hoặc cần giữ reference ổn định vì API phụ thuộc.

## 8. API, dữ liệu và xác thực

- Không gọi `fetch`/Axios trực tiếp trong component trình bày. Đặt request trong `features/<feature>/api` hoặc client dùng chung tại `lib/api`.
- Dùng một HTTP client thống nhất cho base URL, header, cookie, timeout và chuẩn hóa lỗi.
- Mọi endpoint phải có type cho request và response. Dữ liệu từ bên ngoài phải được kiểm tra tại boundary khi cần.
- Không tự đổi tên field, endpoint, HTTP method hoặc dạng payload của backend.
- Không để access token hoặc refresh token nhạy cảm trong source code. Nếu backend dùng HttpOnly cookie, frontend không được cố đọc cookie đó bằng JavaScript.
- Khi gọi API xác thực bằng cookie khác origin, dùng cấu hình credentials theo contract hiện tại và bảo đảm backend kiểm soát CORS/CSRF phù hợp.
- Biến môi trường hiển thị ở trình duyệt chỉ được chứa giá trị công khai và phải dùng tiền tố theo quy ước Next.js. Secret chỉ tồn tại phía server.
- Chuẩn hóa lỗi API thành dạng có thể hiển thị; không để mọi component tự đoán cấu trúc lỗi.
- Không hiển thị trực tiếp stack trace hoặc thông tin nội bộ từ backend cho người dùng.

Nếu dự án đã dùng TanStack Query:

- Dùng query cho server state và giữ query key nhất quán, có factory theo feature khi cần.
- Mutation thành công phải cập nhật cache hoặc invalidate đúng query liên quan, không làm mới toàn bộ ứng dụng.
- Tránh sao chép server state từ query sang global store hoặc local state nếu không có lý do rõ ràng.
- Xử lý riêng loading lần đầu, fetching nền, empty state và error state.

Nếu dự án chưa dùng TanStack Query, không tự ý cài chỉ để hoàn thành một thay đổi nhỏ. Hãy tuân theo data-fetching pattern hiện tại hoặc đề xuất migration riêng.

## 9. State, form và validation

- Local UI state đặt gần component sử dụng nhất.
- Server state thuộc data-fetching layer; không đưa vào Context hoặc global store một cách trùng lặp.
- Global state chỉ dùng cho dữ liệu thật sự xuyên suốt ứng dụng như session đã chuẩn hóa, theme hoặc trạng thái UI toàn cục.
- Không dùng Context lớn khiến toàn bộ cây component render lại cho các state không liên quan.
- Nếu dự án đã có React Hook Form và Zod, dùng chúng thống nhất cho form và validation.
- Schema form phải phản ánh yêu cầu phía client nhưng không thay thế validation của backend.
- Hiển thị lỗi gần field, giữ trạng thái submitting rõ ràng và ngăn submit lặp.
- Không xóa dữ liệu người dùng đã nhập khi API trả lỗi có thể khắc phục.
- Giá trị enum/status gửi lên API phải lấy từ contract hoặc mapping tập trung, không hardcode rải rác.

## 10. Component và giao diện

- Page và container chịu trách nhiệm kết nối dữ liệu; component trình bày nhận props rõ ràng và hạn chế biết về API.
- Tái sử dụng component khi hành vi và giao diện thực sự giống nhau, không chỉ vì tên gần giống.
- Mỗi màn hình tải dữ liệu phải có các trạng thái phù hợp: loading, empty, error và success.
- Giữ giao diện responsive ít nhất cho mobile, tablet và desktop theo breakpoint hiện có.
- Tránh layout shift; dành trước không gian phù hợp cho ảnh, skeleton và nội dung bất đồng bộ.
- Mọi thao tác nguy hiểm như xóa, đóng ticket hoặc thay đổi quyền phải có xác nhận phù hợp và feedback sau thao tác.
- Thông báo thành công/thất bại phải cụ thể, không lộ dữ liệu nhạy cảm và không dựa duy nhất vào màu sắc.

Yêu cầu accessibility tối thiểu:

- Dùng HTML semantic trước ARIA.
- Form control phải có label; icon button phải có accessible name.
- Có thể thao tác bằng bàn phím và nhìn thấy focus state.
- Modal/dialog phải quản lý focus và đóng bằng phím Escape khi phù hợp.
- Màu chữ, trạng thái và thông báo lỗi phải có độ tương phản và cách nhận biết phù hợp.
- Ảnh có `alt` đúng mục đích; ảnh trang trí dùng alt rỗng.

## 11. Phân quyền giao diện

- Tập trung cấu hình role, permission, menu và route access; không rải chuỗi role khắp component.
- Chỉ hiển thị hành động khi session và dữ liệu ticket cho phép, nhưng luôn xử lý trường hợp backend trả `401` hoặc `403`.
- Không suy ra quyền chỉ từ URL hoặc dữ liệu do người dùng nhập.
- Không render chớp nội dung trái quyền trong lúc session đang tải. Dùng loading state hoặc server-side guard phù hợp với kiến trúc hiện tại.
- Không hardcode rằng mọi `STAFF` có thể xem mọi ticket; mặc định staff chỉ thao tác ticket được giao trừ khi đặc tả/backend nói khác.
- Khi quyền thay đổi, cache dữ liệu nhạy cảm phải được xóa hoặc làm mới phù hợp.

## 12. Real-time và upload file

Nếu có Socket.IO hoặc cơ chế real-time:

- Chỉ tạo số connection cần thiết, đăng ký listener một lần và cleanup khi component/provider unmount.
- Tên event và payload phải theo contract backend, có type rõ ràng.
- Event real-time phải cập nhật hoặc invalidate cache hiện có, tránh duy trì hai nguồn dữ liệu cạnh tranh.
- Xử lý reconnect, event trùng và trường hợp event đến sai thứ tự ở mức phù hợp.
- Không giả định event socket đã được lưu bền; dữ liệu chính thức vẫn lấy từ API/database.

Khi upload file:

- Kiểm tra loại file, kích thước và số lượng theo quy định trước khi gửi.
- Không tin filename hoặc MIME type phía client là biện pháp bảo mật đầy đủ.
- Hiển thị tiến trình/lỗi khi trải nghiệm yêu cầu và cho phép thử lại an toàn.
- Thu hồi object URL được tạo để preview khi không còn sử dụng.

## 13. Quy trình refactor bắt buộc

### Trước khi refactor

1. Đọc các file liên quan và lần theo luồng route → component → hook/query → API → type/schema.
2. Kiểm tra `git status` và không ghi đè thay đổi ngoài phạm vi.
3. Xác định hành vi phải giữ nguyên và rủi ro có thể phát sinh.
4. Chạy các kiểm tra nền có sẵn nếu hợp lý để phân biệt lỗi cũ với lỗi mới.
5. Nêu ngắn gọn phạm vi và kế hoạch trước khi thực hiện thay đổi lớn.

### Trong khi refactor

1. Chia thay đổi theo feature hoặc trách nhiệm nhỏ, có thể kiểm tra độc lập.
2. Ưu tiên refactor không đổi hành vi trước; thay đổi nghiệp vụ phải là bước riêng và được yêu cầu rõ ràng.
3. Giữ compatibility tạm thời khi đổi public API nội bộ có nhiều nơi sử dụng; cập nhật mọi call site trước khi xóa code cũ.
4. Di chuyển file phải cập nhật toàn bộ import, test, alias và route liên quan.
5. Không vừa đổi cấu trúc toàn dự án, đổi thư viện state, đổi UI và đổi API trong cùng một bước nếu không thật sự cần.
6. Sau mỗi nhóm thay đổi, chạy kiểm tra hẹp nhất có ý nghĩa rồi mới mở rộng.

### Sau khi refactor

1. Chạy format, lint, typecheck, test và build bằng script thực sự có trong `package.json`.
2. Không báo “đã pass” nếu chưa chạy. Nếu không thể chạy, ghi chính xác kiểm tra nào chưa chạy và lý do.
3. Kiểm tra thủ công luồng chính liên quan tới thay đổi, bao gồm trạng thái loading, empty, error và permission denied.
4. Xem lại diff để phát hiện file ngoài phạm vi, code debug, secret, import chết và thay đổi hành vi ngoài ý muốn.
5. Báo cáo file đã đổi, lý do, kiểm tra đã chạy, kết quả và phần người dùng cần kiểm tra thêm.

## 14. Chiến lược refactor ưu tiên cho code cũ

Thực hiện theo thứ tự, chỉ đi đến bước tiếp theo khi bước trước ổn định:

1. Loại bỏ lỗi TypeScript, import hỏng, code chết và side effect không kiểm soát.
2. Chuẩn hóa API client, error mapping và type request/response.
3. Làm mỏng `page.tsx` và component quá lớn bằng cách tách theo trách nhiệm.
4. Gom logic nghiệp vụ vào feature hook/service phù hợp.
5. Chuẩn hóa query key, cache invalidation và trạng thái bất đồng bộ.
6. Chuẩn hóa form/schema và loại bỏ validation trùng lặp.
7. Tập trung role/permission và mapping status.
8. Cải thiện accessibility, responsive và hiệu năng dựa trên vấn đề thực tế.
9. Bổ sung test cho hành vi quan trọng hoặc bug đã sửa.

Không thực hiện “big-bang refactor” toàn bộ frontend khi có thể chuyển đổi từng feature như `auth`, `tickets`, `users` và `dashboard`.

## 15. Kiểm thử và quality gate

Chỉ chạy script có thật trong `package.json`. Bộ kiểm tra mong muốn gồm:

```bash
npm run format
npm run lint
npm run typecheck
npm test
npm run build
```

Tên lệnh trên là mục tiêu, không phải lý do để tự ý thêm script hoặc đổi package manager. Nếu repository dùng `pnpm` hoặc `yarn`, dùng lệnh tương ứng theo lockfile.

Ưu tiên test:

- Unit test cho utility, mapper, schema và logic chuyển đổi dữ liệu.
- Component/integration test cho form, permission, error state và hành động quan trọng.
- E2E cho đăng nhập, tạo ticket, phân công, xử lý, đóng/mở lại ticket và các luồng chính theo vai trò khi dự án đã có hạ tầng E2E.
- Bug fix nên có regression test khi hợp lý.

Không sửa test chỉ để hợp thức hóa hành vi sai. Nếu yêu cầu mới làm thay đổi hành vi được chấp thuận, cập nhật cả implementation và test tương ứng.

## 16. Hiệu năng

- Đo hoặc xác định nguyên nhân trước khi tối ưu.
- Tránh request trùng, waterfall không cần thiết và refetch toàn bộ sau mutation nhỏ.
- Phân trang hoặc virtualize danh sách ticket lớn khi dữ liệu thực tế yêu cầu.
- Lazy-load phần nặng không cần cho lần render đầu, nhưng không làm trải nghiệm loading phức tạp vô ích.
- Dùng tối ưu ảnh/font của Next.js theo cấu hình dự án.
- Không đưa thư viện nặng vào Client Component hoặc bundle chung nếu chỉ một route sử dụng.

## 17. Những việc agent không được tự ý làm

- Không sửa backend NestJS, schema Prisma, migration hoặc Docker nếu yêu cầu chỉ thuộc frontend.
- Không đổi endpoint, payload, role, permission, ticket status hoặc luồng nghiệp vụ.
- Không thay toàn bộ thư viện UI, state management, form hoặc data fetching chỉ vì sở thích cá nhân.
- Không đổi thiết kế hình ảnh hàng loạt trong một yêu cầu refactor kỹ thuật.
- Không xóa test đang thất bại, tắt lint/typecheck hoặc làm yếu rule để có kết quả xanh giả tạo.
- Không tạo duplicate component/service/type khi đã có implementation phù hợp.
- Không commit, push, mở pull request hoặc deploy nếu người dùng chưa yêu cầu.

## 18. Định nghĩa hoàn thành

Một thay đổi chỉ được coi là hoàn thành khi:

- Đúng yêu cầu và không mở rộng phạm vi ngoài ý muốn.
- Giữ đúng API contract và quy tắc phân quyền.
- Không còn lỗi mới từ lint, TypeScript, test hoặc build trong phạm vi có thể chạy.
- Có đủ loading, empty, error và success state cho luồng bất đồng bộ bị tác động.
- Không chứa secret, log debug, code chết hoặc import thừa.
- Giao diện liên quan vẫn responsive và có accessibility cơ bản.
- Các file và abstraction mới có trách nhiệm rõ ràng, tên dễ hiểu.
- Báo cáo cuối cùng nêu rõ thay đổi, kiểm tra đã chạy, kết quả và rủi ro hoặc việc chưa xác minh.

## 19. Mẫu báo cáo sau khi làm việc

Agent kết thúc công việc bằng báo cáo ngắn theo mẫu:

```text
Đã thay đổi:
- ...

Lý do:
- ...

Đã kiểm tra:
- <command/check>: PASS | FAIL | NOT RUN

Cần kiểm tra thủ công:
- ...

Ghi chú/rủi ro còn lại:
- ...
```

Nếu phát hiện vấn đề ngoài phạm vi, chỉ ghi chú và đề xuất bước tiếp theo; không tự ý sửa trong cùng yêu cầu.
