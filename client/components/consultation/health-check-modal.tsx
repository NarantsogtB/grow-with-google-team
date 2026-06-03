"use client";

import { useRef } from "react";
import { X } from "lucide-react";

interface HealthCheckModalProps {
  open: boolean;
  onClose: () => void;
}

const medicalHistoryOptions = [
  "Зүрхний өвчин",
  "Цээж / Багтраа",
  "Бөөр / Давсаг",
  "Тархины харвалт",
  "Хоол боловсруулах / Элэг",
  "Чихрийн шижин",
  "Эмэгтэйчүүд",
  "Үе мөч / Нуруу",
];

const lifestyleQuestions = [
  {
    label: "Та тамхи татдаг уу?",
    name: "smoking",
    choices: ["Үгүй", "Заримдаа", "Өдөр бүр"],
  },
  {
    label: "Та согтууруулах ундаа хэрэглэдэг үү?",
    name: "alcohol",
    choices: ["Үгүй", "Хааяа", "Долоо хоног бүр"],
  },
  {
    label: "Хөдөлгөөний идэвх",
    name: "exercise",
    choices: ["Бага", "Дунд", "Их"],
  },
];

export function HealthCheckModal({ open, onClose }: HealthCheckModalProps) {
  const printableRef = useRef<HTMLDivElement>(null);
  const currentDateTime = formatDateTimeLocal(new Date());

  if (!open) return null;

  const handleSavePdf = () => {
    if (!printableRef.current) return;

    const printWindow = window.open("", "_blank", "width=900,height=1200");
    if (!printWindow) return;

    const printableClone = printableRef.current.cloneNode(true) as HTMLDivElement;
    syncFormControlValues(printableRef.current, printableClone);

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Эрүүл мэндийн асуумж</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: white;
              color: #0f172a;
              font-family: Arial, sans-serif;
              font-size: 11px;
              line-height: 1.2;
            }

            .health-check-print-page {
              width: 210mm;
              height: 296mm;
              overflow: hidden;
              padding: 10mm;
              page-break-after: always;
            }

            .health-check-print-page:last-child {
              page-break-after: auto;
            }

            .grid {
              display: grid;
            }

            .sm\\:grid-cols-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .sm\\:col-span-2 {
              grid-column: span 2 / span 2;
            }

            .flex {
              display: flex;
            }

            .flex-wrap {
              flex-wrap: wrap;
            }

            .items-center {
              align-items: center;
            }

            .gap-2 {
              gap: 8px;
            }

            .gap-3 {
              gap: 10px;
            }

            .gap-4 {
              gap: 12px;
            }

            .text-center {
              text-align: center;
            }

            .uppercase {
              text-transform: uppercase;
            }

            .underline {
              text-decoration: underline;
            }

            .font-black {
              font-weight: 900;
            }

            .font-bold {
              font-weight: 700;
            }

            .font-semibold {
              font-weight: 600;
            }

            .text-lg,
            h3 {
              font-size: 15px;
            }

            .text-sm {
              font-size: 11px;
            }

            .mx-auto {
              margin-left: auto;
              margin-right: auto;
            }

            .mt-2 {
              margin-top: 4px;
            }

            .mt-3,
            .mb-3 {
              margin-top: 8px;
              margin-bottom: 8px;
            }

            .mt-6 {
              margin-top: 12px;
            }

            .mb-2 {
              margin-bottom: 6px;
            }

            .mb-5 {
              margin-bottom: 12px;
            }

            .block {
              display: block;
            }

            .w-full {
              width: 100%;
            }

            .max-w-3xl,
            .max-w-4xl {
              max-width: none;
            }

            .overflow-hidden {
              overflow: hidden;
            }

            .rounded-xl,
            .rounded-lg,
            .rounded-md,
            .rounded-2xl {
              border-radius: 8px;
            }

            .border,
            .border-b,
            input,
            textarea {
              border-color: #cbd5e1;
            }

            .border {
              border-width: 1px;
              border-style: solid;
            }

            .border-b {
              border-bottom-width: 1px;
              border-bottom-style: solid;
            }

            .bg-white {
              background: white;
            }

            .bg-slate-50,
            .bg-slate-50\\/60,
            .bg-slate-50\\/70 {
              background: #f8fafc;
            }

            label {
              min-height: auto !important;
              padding: 6px 8px !important;
            }

            input,
            textarea {
              width: 100%;
              border-width: 1px;
              border-style: solid;
              border-radius: 8px;
              background: white;
              color: #0f172a;
              font: inherit;
              padding: 4px 8px;
            }

            input[type="checkbox"],
            input[type="radio"] {
              width: 14px;
              height: 14px;
              padding: 0;
            }

            textarea {
              height: 24mm;
              resize: none;
            }
          </style>
        </head>
        <body>${printableClone.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-[#f8fafc] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-[#1e5d48]">
              Шинэ үзлэг
            </p>
            <h2 className="text-xl font-black text-[#1e293b]">
              Өвчтөний эрүүл мэндийн асуумж
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Эрүүл мэндийн асуумж хаах"
            className="grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="size-5" />
          </button>
        </div>

        <form className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div
            data-health-check-pdf
            ref={printableRef}
            className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 shadow-sm sm:p-6"
          >
            <div className="health-check-print-page">
              <div className="mb-5 text-center">
                <h3 className="text-lg font-black uppercase underline">
                  Шинэ өвчтөний эрүүл мэндийн асуумж
                </h3>
                <p className="mx-auto mt-3 max-w-3xl text-left font-semibold leading-relaxed">
                  Үзлэгт орохоос өмнө дараах асуумжийг бөглөнө үү.
                </p>
              </div>

              <label className="mb-3 block rounded-xl border border-slate-200 bg-slate-50/60 p-3 font-black">
                Үзлэгийн огноо, цаг:
                <input
                  type="datetime-local"
                  value={currentDateTime}
                  readOnly
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold outline-none focus:border-[#1e5d48]"
                />
              </label>

              <div className="grid overflow-hidden rounded-xl border border-slate-200 sm:grid-cols-2">
                <Field label="Овог" />
                <Field label="Нэр" />
                <Field label="Хаяг" className="sm:col-span-2" />
                <Field label="Утасны дугаар" digitsOnly maxLength={8} />
                <Field label="Төрсөн огноо" type="date" />
                <Field label="Ажил мэргэжил" className="sm:col-span-2" type="profession" />
                <Field label="И-мэйл хаяг" className="sm:col-span-2" type="email" />
                <Field label="Нэг хаяг дээр амьдардаг гэр бүлийн гишүүд" className="sm:col-span-2" />
              </div>
            </div>

            <div className="health-check-print-page">
              <section>
                <p className="mb-2 font-black">
                  Дараах өвчин, зовуурь танд байсан эсэхийг тэмдэглэнэ үү:
                </p>
                <div className="grid overflow-hidden rounded-xl border border-slate-200 sm:grid-cols-2">
                  {medicalHistoryOptions.map((option) => (
                    <label
                      key={option}
                      className="flex min-h-10 items-center gap-4 border-b border-slate-200 px-3 py-2 font-bold last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
                    >
                      <input
                        type="checkbox"
                        className="size-5 accent-[#1e5d48]"
                        name="medicalHistory"
                        value={option}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="mt-6">
                <p className="mb-2 font-black">Дэлгэрэнгүй мэдээлэл:</p>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <Field label="Мэс засал" />
                  <Field label="Харшил" />
                  <Field label="Эм хэрэглээ" />
                </div>
              </section>

              <section className="mt-6">
                <p className="mb-3 font-black">Амьдралын хэв маягийн асуултууд</p>
                <div className="grid gap-3">
                  {lifestyleQuestions.map((question) => (
                    <div
                      key={question.name}
                      className="rounded-lg border border-slate-300 bg-slate-50 p-3"
                    >
                      <p className="mb-2 font-black">{question.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {question.choices.map((choice) => (
                          <label
                            key={choice}
                            className="flex items-center gap-2 px-3 py-2 font-bold"
                          >
                            <input
                              type="radio"
                              name={question.name}
                              value={choice}
                              className="accent-[#1e5d48]"
                            />
                            {choice}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <label className="mt-6 block font-black">
                Нэмэлт тэмдэглэл
                <textarea
                  rows={4}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-3 font-semibold outline-none focus:border-[#1e5d48]"
                  placeholder="Зовуурь, санаа зовоож буй зүйл, гэр бүлийн өвчний түүх эсвэл бусад мэдээлэл..."
                />
              </label>
            </div>
          </div>
        </form>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition-all hover:bg-slate-50"
          >
            Болих
          </button>
          <button
            type="button"
            onClick={handleSavePdf}
            className="rounded-xl bg-[#1e5d48] px-5 py-3 text-sm font-black text-white shadow-md transition-all hover:bg-[#164737]"
          >
            Асуумж хадгалах
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDateTimeLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function syncFormControlValues(source: HTMLElement, target: HTMLElement) {
  const sourceControls = source.querySelectorAll("input, textarea");
  const targetControls = target.querySelectorAll("input, textarea");

  sourceControls.forEach((sourceControl, index) => {
    const targetControl = targetControls[index];
    if (!targetControl) return;

    if (sourceControl instanceof HTMLTextAreaElement) {
      const targetTextArea = targetControl as HTMLTextAreaElement;
      targetTextArea.value = sourceControl.value;
      targetTextArea.textContent = sourceControl.value;
      return;
    }

    if (sourceControl instanceof HTMLInputElement) {
      const targetInput = targetControl as HTMLInputElement;

      if (sourceControl.type === "checkbox" || sourceControl.type === "radio") {
        targetInput.checked = sourceControl.checked;
        if (sourceControl.checked) {
          targetInput.setAttribute("checked", "checked");
        } else {
          targetInput.removeAttribute("checked");
        }
        return;
      }

      targetInput.value = sourceControl.value;
      targetInput.setAttribute("value", sourceControl.value);
    }
  });
}

function Field({
  label,
  type = "text",
  className = "",
  digitsOnly = false,
  maxLength,
}: {
  label: string;
  type?: string;
  className?: string;
  digitsOnly?: boolean;
  maxLength?: number;
}) {
  return (
    <label
      className={`block min-h-16 border-b border-slate-200 bg-white p-3 font-black ${className}`}
    >
      {label}:
      <input
        type={type}
        inputMode={digitsOnly ? "numeric" : undefined}
        pattern={digitsOnly ? "\\d*" : undefined}
        maxLength={maxLength}
        onInput={
          digitsOnly
            ? (event) => {
                event.currentTarget.value = event.currentTarget.value
                  .replace(/\D/g, "")
                  .slice(0, maxLength);
              }
            : undefined
        }
        className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1.5 text-sm font-semibold outline-none focus:border-[#1e5d48] focus:bg-white"
      />
    </label>
  );
}
