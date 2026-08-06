"use client";

import {
  useActionState,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  File,
  FileText,
  Link2,
  Loader2,
  Plus,
  Type,
  Upload,
  Video,
  X,
} from "lucide-react";
import {
  createContent,
  type ContentActionState,
} from "./actions";

type ContentFormProps = {
  productId: string;
  moduleId: string;
  nextPosition: number;
};

const initialState: ContentActionState = {};

const contentTypes = [
  {
    value: "video",
    label: "Vídeo",
    icon: Video,
  },
  {
    value: "pdf",
    label: "PDF",
    icon: FileText,
  },
  {
    value: "text",
    label: "Texto",
    icon: Type,
  },
  {
    value: "file",
    label: "Arquivo",
    icon: File,
  },
  {
    value: "link",
    label: "Link externo",
    icon: Link2,
  },
];

export function ContentForm({
  productId,
  moduleId,
  nextPosition,
}: ContentFormProps) {
  const [state, formAction, pending] =
    useActionState(
      createContent,
      initialState
    );

  const [contentType, setContentType] =
    useState("video");

  const [uploading, setUploading] =
    useState(false);

  const [uploadError, setUploadError] =
    useState("");

  const [filePath, setFilePath] =
    useState("");

  const [fileName, setFileName] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const needsExternalUrl =
    contentType === "video" ||
    contentType === "link";

  const needsUpload =
    contentType === "pdf" ||
    contentType === "file";

  const needsBody =
    contentType === "text";

  async function handleFileUpload(
    file: File
  ) {
    setUploading(true);
    setUploadError("");

    try {
      const data =
        new FormData();

      data.append(
        "file",
        file
      );

      data.append(
        "product_id",
        productId
      );

      data.append(
        "module_id",
        moduleId
      );

      const response =
        await fetch(
          "/api/admin/upload",
          {
            method: "POST",
            body: data,
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          "Não foi possível enviar o arquivo."
        );
      }

      setFilePath(
        result.file_path
      );

      setFileName(
        result.file_name ||
        file.name
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o arquivo.";

      setUploadError(
        message
      );

      setFilePath("");
      setFileName("");
    } finally {
      setUploading(false);
    }
  }

  function removeFile() {
    setFilePath("");
    setFileName("");
    setUploadError("");

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        "";
    }
  }

  function changeContentType(
    value: string
  ) {
    setContentType(value);

    if (
      value !== "pdf" &&
      value !== "file"
    ) {
      removeFile();
    }
  }

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-[24px] border border-violet-200 bg-violet-50/50 p-5"
    >
      <input
        type="hidden"
        name="product_id"
        value={productId}
      />

      <input
        type="hidden"
        name="module_id"
        value={moduleId}
      />

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">
          Novo conteúdo
        </p>

        <h4 className="mt-1 font-black">
          Adicionar ao módulo
        </h4>
      </div>

      {state.error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          {state.error}
        </div>
      )}

      {state.success && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0"
          />

          {state.success}
        </div>
      )}

      <label className="block">
        <span className="text-sm font-bold">
          Título
        </span>

        <input
          name="title"
          required
          placeholder="Ex.: Aula de boas-vindas"
          className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold">
          Descrição
        </span>

        <textarea
          name="description"
          rows={3}
          placeholder="Descrição opcional."
          className="mt-2 w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
        />
      </label>

      <div>
        <span className="text-sm font-bold">
          Tipo de conteúdo
        </span>

        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {contentTypes.map(
            (type) => {
              const Icon =
                type.icon;

              const selected =
                contentType ===
                type.value;

              return (
                <label
                  key={
                    type.value
                  }
                  className={`cursor-pointer rounded-2xl border p-3 text-center transition ${
                    selected
                      ? "border-violet-500 bg-violet-100 text-violet-700"
                      : "border-zinc-200 bg-white text-zinc-500 hover:border-violet-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="content_type"
                    value={
                      type.value
                    }
                    checked={
                      selected
                    }
                    onChange={() =>
                      changeContentType(
                        type.value
                      )
                    }
                    className="sr-only"
                  />

                  <Icon
                    size={19}
                    className="mx-auto"
                  />

                  <span className="mt-2 block text-xs font-bold">
                    {type.label}
                  </span>
                </label>
              );
            }
          )}
        </div>
      </div>

      {needsExternalUrl && (
        <label className="block">
          <span className="text-sm font-bold">
            {contentType ===
            "video"
              ? "Link do vídeo"
              : "Link externo"}
          </span>

          <input
            name="external_url"
            type="url"
            required
            placeholder={
              contentType ===
              "video"
                ? "https://youtube.com/..."
                : "https://..."
            }
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
          />

          {contentType ===
            "video" && (
            <span className="mt-1 block text-xs text-zinc-400">
              Pode ser YouTube,
              Vimeo ou outro
              endereço de vídeo.
            </span>
          )}
        </label>
      )}

      {needsUpload && (
        <div>
          <span className="text-sm font-bold">
            {contentType ===
            "pdf"
              ? "Arquivo PDF"
              : "Arquivo para download"}
          </span>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={
              contentType ===
              "pdf"
                ? ".pdf,application/pdf"
                : ".pdf,.zip,.rar,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.webp"
            }
            onChange={
              async (
                event
              ) => {
                const file =
                  event.target
                    .files?.[0];

                if (!file) {
                  return;
                }

                await handleFileUpload(
                  file
                );
              }
            }
          />

          <input
            type="hidden"
            name="file_path"
            value={filePath}
          />

          {!filePath ? (
            <button
              type="button"
              disabled={
                uploading
              }
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="mt-2 flex min-h-36 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-6 text-center transition hover:border-violet-400 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <Loader2
                    size={28}
                    className="animate-spin text-violet-600"
                  />

                  <span className="mt-3 text-sm font-bold text-zinc-700">
                    Enviando
                    arquivo...
                  </span>

                  <span className="mt-1 text-xs text-zinc-400">
                    Aguarde o
                    upload terminar.
                  </span>
                </>
              ) : (
                <>
                  <Upload
                    size={28}
                    className="text-violet-600"
                  />

                  <span className="mt-3 text-sm font-bold text-zinc-700">
                    Selecionar
                    arquivo
                  </span>

                  <span className="mt-1 text-xs text-zinc-400">
                    Clique para
                    escolher no seu
                    computador.
                  </span>

                  <span className="mt-2 text-[11px] text-zinc-400">
                    Máximo: 50 MB
                  </span>
                </>
              )}
            </button>
          ) : (
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2
                  size={20}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-emerald-900">
                  {fileName}
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  Upload concluído
                </p>
              </div>

              <button
                type="button"
                onClick={
                  removeFile
                }
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-zinc-500 transition hover:text-red-600"
                title="Remover arquivo"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {uploadError && (
            <div className="mt-2 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle
                size={16}
                className="shrink-0"
              />

              {uploadError}
            </div>
          )}
        </div>
      )}

      {needsBody && (
        <label className="block">
          <span className="text-sm font-bold">
            Conteúdo do texto
          </span>

          <textarea
            name="body"
            required
            rows={8}
            placeholder="Digite aqui o conteúdo da aula ou material..."
            className="mt-2 w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-3 leading-7 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
          />
        </label>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="text-sm font-bold">
            Posição
          </span>

          <input
            name="position"
            type="number"
            min="0"
            defaultValue={
              nextPosition
            }
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-violet-400"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:mt-7">
          <div>
            <p className="text-sm font-bold">
              Conteúdo de prévia
            </p>

            <p className="text-xs text-zinc-400">
              Pode ser visto sem
              acesso.
            </p>
          </div>

          <input
            name="is_preview"
            type="checkbox"
            className="size-5 accent-violet-600"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={
          pending ||
          uploading ||
          (needsUpload &&
            !filePath)
        }
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3.5 font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <Loader2
            size={18}
            className="animate-spin"
          />
        ) : (
          <Plus size={18} />
        )}

        {pending
          ? "Adicionando..."
          : "Adicionar conteúdo"}
      </button>
    </form>
  );
}