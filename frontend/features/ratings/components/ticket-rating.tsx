"use client";

import { useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AuthUser } from "@/features/auth/types";
import type { RatingRecord, TicketRecord } from "@/features/tickets/types";
import { createRating } from "../api/ratings-api";

export function TicketRating({
  ticket,
  token,
  currentUser,
}: {
  ticket: TicketRecord;
  token: string;
  currentUser: AuthUser;
}) {
  const [rating, setRating] = useState<RatingRecord | null>(ticket.rating);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const canRate =
    !rating &&
    ticket.status === "CLOSED" &&
    currentUser.role === "USER" &&
    ticket.creator.id === currentUser.id &&
    Boolean(ticket.assignee);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (score < 1) {
      setError("Hãy chọn số sao đánh giá.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const created = await createRating(
        ticket.id,
        { score, comment: comment.trim() || undefined },
        token,
      );
      setRating(created);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể gửi đánh giá.",
      );
    } finally {
      setPending(false);
    }
  }

  if (!rating && !canRate) return null;

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Star className="size-5 fill-amber-400 text-amber-500" />
        <h2 className="font-bold">Đánh giá hỗ trợ</h2>
      </div>
      {rating ? (
        <div className="mt-4">
          <div className="flex gap-1" aria-label={`${rating.score} trên 5 sao`}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Star
                key={value}
                className={`size-6 ${value <= rating.score ? "fill-amber-400 text-amber-500" : "text-slate-300"}`}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Đánh giá dành cho {rating.agent.fullName}
          </p>
          {rating.comment ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {rating.comment}
            </p>
          ) : null}
        </div>
      ) : (
        <form className="mt-4" onSubmit={submit}>
          <fieldset>
            <legend className="text-sm font-semibold">Mức độ hài lòng</legend>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} sao`}
                  aria-pressed={score === value}
                  className="rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setScore(value)}
                >
                  <Star className={`size-7 ${value <= score ? "fill-amber-400 text-amber-500" : "text-slate-300"}`} />
                </button>
              ))}
            </div>
          </fieldset>
          <label htmlFor="rating-comment" className="mt-4 block text-sm font-semibold">
            Nhận xét <span className="font-normal text-slate-500">(không bắt buộc)</span>
          </label>
          <Textarea
            id="rating-comment"
            className="mt-2"
            rows={3}
            maxLength={1000}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
          <Button className="mt-4" disabled={pending || score === 0}>
            {pending ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </form>
      )}
    </section>
  );
}
