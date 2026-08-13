import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Tailwind,
  pixelBasedPreset,
} from "react-email";

export function InvitationEmail({
  kidName,
  code,
  expiresLabel,
  activationUrl,
}: {
  kidName: string;
  code: string;
  expiresLabel: string;
  activationUrl: string;
}) {
  return (
    <Html lang="es">
      <Head />
      <Preview>
        Te invitaron a seguir a {kidName} en OpenDayCare
      </Preview>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                ink: "#3F362E",
                "ink-soft": "#5B534A",
                gold: "#B8862F",
                "gold-line": "#E4C48F",
                coral: "#F2937A",
                cream: "#FFF9F0",
                warm: "#FFF3E0",
              },
            },
          },
        }}
      >
        <Body className="bg-cream font-sans">
          <Container className="mx-auto max-w-[480px] px-6 py-8">
            <div className="mb-6 flex items-center gap-2.5">
              <span className="text-[26px] leading-none">☀️</span>
              <span className="text-[20px] font-bold text-ink">
                OpenDayCare
              </span>
            </div>

            <Heading className="mb-3 text-[24px] font-bold text-ink">
              Te invitaron a seguir a {kidName}
            </Heading>

            <Text className="mb-6 text-[15px] leading-relaxed text-ink-soft">
              Usá este código para activar tu cuenta y ver el día de {kidName}{" "}
              en la guardería.
            </Text>

            <div className="mb-6 rounded-[16px] border-[1.5px] border-dashed border-gold-line bg-warm px-5 py-5 text-center">
              <div className="mb-2 text-[12px] font-bold tracking-[1.5px] text-gold">
                CÓDIGO DE INVITACIÓN
              </div>
              <div className="mb-2 text-[34px] font-bold tracking-[8px] text-ink">
                {code}
              </div>
              <div className="text-[13px] text-gold">{expiresLabel}</div>
            </div>

            <Button
              href={activationUrl}
              target="_blank"
              className="block w-full rounded-[14px] bg-coral px-6 py-3.5 text-center text-[16px] font-bold text-white no-underline"
            >
              Activar mi cuenta
            </Button>

            <Text className="mt-5 text-[12px] leading-relaxed text-[#9C9388]">
              Si el botón no funciona, copiá este enlace en tu navegador:{" "}
              <span className="break-all text-gold">{activationUrl}</span>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
