"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FolderKanban, Pencil, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createCategory,
  deactivateCategory,
  listCategories,
  updateCategory,
  type CategoryRecord,
} from "../api/categories-api";

export function CategoriesPage({ token }: { token: string }) {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<CategoryRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    listCategories(token, controller.signal)
      .then((result) => {
        setCategories(result);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        )
          return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Không thể tải danh mục.",
        );
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [revision, token]);

  const visibleCategories = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("vi");
    if (!term) return categories;
    return categories.filter(
      (category) =>
        category.name.toLocaleLowerCase("vi").includes(term) ||
        category.description?.toLocaleLowerCase("vi").includes(term),
    );
  }, [categories, search]);

  function openEditor(category?: CategoryRecord) {
    setEditing(category ?? null);
    setName(category?.name ?? "");
    setDescription(category?.description ?? "");
    setActionError("");
    setDialogOpen(true);
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setActionError("Tên danh mục cần ít nhất 2 ký tự.");
      return;
    }
    setPending(true);
    setActionError("");
    try {
      const payload = {
        name: cleanName,
        description: editing ? description.trim() : description.trim() || undefined,
      };
      if (editing) await updateCategory(editing.id, payload, token);
      else await createCategory(payload, token);
      setDialogOpen(false);
      setLoading(true);
      setRevision((value) => value + 1);
    } catch (requestError: unknown) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể lưu danh mục.",
      );
    } finally {
      setPending(false);
    }
  }

  async function toggleCategory(category: CategoryRecord) {
    if (
      category.isActive &&
      !window.confirm(
        `Ngừng sử dụng danh mục “${category.name}”? Các ticket hiện có vẫn được giữ lại.`,
      )
    )
      return;
    setActionError("");
    try {
      if (category.isActive) await deactivateCategory(category.id, token);
      else await updateCategory(category.id, { isActive: true }, token);
      setLoading(true);
      setRevision((value) => value + 1);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể cập nhật danh mục.",
      );
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Cấu hình"
        title="Danh mục hỗ trợ"
        description="Tổ chức ticket theo từng nhóm vấn đề."
        actions={
          <Button className="w-full sm:w-auto" onClick={() => openEditor()}>
            <Plus /> Thêm danh mục
          </Button>
        }
      />
      <div className="relative mt-6 max-w-sm">
        <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
        <Input
          aria-label="Tìm danh mục"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9"
          placeholder="Tìm tên hoặc mô tả..."
        />
      </div>

      {loading ? (
        <div className="mt-4 rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          Đang tải danh mục...
        </div>
      ) : error ? (
        <div role="alert" className="mt-4 rounded-xl bg-destructive/10 p-5 text-sm text-destructive">
          <p>{error}</p>
          <Button variant="outline" className="mt-3" onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>
            Thử lại
          </Button>
        </div>
      ) : visibleCategories.length === 0 ? (
        <div className="mt-4 rounded-xl border bg-card p-10 text-center">
          <FolderKanban className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">
            {categories.length === 0 ? "Chưa có danh mục" : "Không tìm thấy danh mục"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {categories.length === 0
              ? "Danh mục mới sẽ xuất hiện tại đây."
              : "Hãy thử một từ khóa khác."}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCategories.map((category) => (
            <article key={category.id} className="rounded-xl border bg-card p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <FolderKanban className="size-5" />
                </div>
                <Badge
                  variant="outline"
                  className={
                    category.isActive
                      ? "border-transparent bg-success/10 text-success"
                      : "border-transparent bg-muted text-muted-foreground"
                  }
                >
                  {category.isActive ? "Đang hoạt động" : "Ngừng sử dụng"}
                </Badge>
              </div>
              <h2 className="mt-5 font-semibold">{category.name}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {category.description || "Chưa có mô tả."}
              </p>
              <div className="mt-5 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditor(category)}>
                  <Pencil /> Sửa
                </Button>
                <Button
                  variant={category.isActive ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => void toggleCategory(category)}
                >
                  {category.isActive ? "Ngừng sử dụng" : "Kích hoạt"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={saveCategory}>
            <DialogHeader>
              <DialogTitle>{editing ? "Sửa danh mục" : "Thêm danh mục"}</DialogTitle>
              <DialogDescription>
                Danh mục đang hoạt động sẽ xuất hiện khi khách hàng tạo ticket.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <div className="grid gap-2">
                <Label htmlFor="category-name">Tên danh mục</Label>
                <Input id="category-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} autoFocus />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category-description">Mô tả</Label>
                <Textarea id="category-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={4} />
              </div>
              {actionError ? <p role="alert" className="text-sm text-destructive">{actionError}</p> : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
              <Button disabled={pending}>{pending ? "Đang lưu..." : "Lưu danh mục"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
