"use client";

type BookingQrCardProps = {
  bookingUrl: string;
};

export default function BookingQrCard({ bookingUrl }: BookingQrCardProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    bookingUrl
  )}`;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-zinc-900">
        Código QR de tu reserva online
      </h3>
      <p className="mt-2 text-sm text-zinc-500">
        Puedes enseñarlo en el salón o imprimirlo para que tus clientes accedan
        directamente a tu web de reservas.
      </p>

      <div className="mt-5 flex flex-col items-center gap-4 lg:flex-row lg:items-start">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <img
            src={qrUrl}
            alt="Código QR de la web de reservas"
            className="h-[220px] w-[220px]"
          />
        </div>

        <div className="w-full">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 break-all">
            {bookingUrl}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={qrUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Abrir QR
            </a>

            <a
              href={bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Abrir web pública
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}