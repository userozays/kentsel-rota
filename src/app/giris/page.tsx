import type { Metadata } from "next";
import { GirisFormu } from "./giris-formu";

export const metadata: Metadata = { title: "Giriş" };

export default async function GirisSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ devam?: string }>;
}) {
  const { devam } = await searchParams;

  return (
    <div className="page page-center">
      <div className="container container-tight py-4">
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center gap-2">
            <span className="avatar bg-primary text-white">KR</span>
            <span className="h2 mb-0">Kentsel Rota Panel</span>
          </div>
          <div className="text-secondary mt-2">Kentsel dönüşüm süreç ve portföy yönetimi</div>
        </div>

        <div className="card card-md">
          <div className="card-body">
            <h2 className="card-title text-center mb-4">Hesabınıza giriş yapın</h2>
            <GirisFormu devam={devam ?? "/"} />
          </div>
        </div>

        <div className="text-center text-secondary mt-3 small">
          Hesabınız yok mu? Şirket yöneticinizle iletişime geçin.
        </div>
      </div>
    </div>
  );
}
