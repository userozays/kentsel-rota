import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { oturumGerekli } from "@/lib/auth";
import { yetkiVar } from "@/lib/roller";
import { db } from "@/lib/db";
import { muteahhitGuncelle } from "@/actions/muteahhit";
import { EylemFormu, Gonder } from "@/components/Form";
import { MuteahhitAlanlari } from "@/components/MuteahhitAlanlari";

export const metadata = { title: "Müteahhit düzenle — Kentsel Rota" };

export default async function MuteahhitDuzenleSayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kullanici = await oturumGerekli();
  if (!yetkiVar(kullanici.rol, "muteahhitYaz")) redirect("/muteahhitler");

  const muteahhit = await db.muteahhit.findUnique({
    where: { id },
    include: { _count: { select: { teklifler: true } } },
  });
  if (!muteahhit) notFound();

  return (
    <>
      <div className="crumb">
        <Link href="/muteahhitler">← Müteahhitler</Link>
        <span>/</span>
        <span>{muteahhit.unvan}</span>
      </div>

      <div className="head">
        <div>
          <h1>{muteahhit.unvan}</h1>
          <div className="sub">
            {muteahhit._count.teklifler > 0
              ? `Bu yükleniciye ait ${muteahhit._count.teklifler} teklif kayıtlı — kayıt silinemez, gerekirse kara listeye al.`
              : "Henüz teklif vermemiş."}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="pbody">
          <EylemFormu eylem={muteahhitGuncelle}>
            <input type="hidden" name="id" value={muteahhit.id} />
            <MuteahhitAlanlari deger={muteahhit} />
            <div className="form-alt">
              <Link href="/muteahhitler" className="btn">
                Vazgeç
              </Link>
              <Gonder />
            </div>
          </EylemFormu>
        </div>
      </div>
    </>
  );
}
