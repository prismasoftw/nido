import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Próximamente</CardTitle>
          <CardDescription>
            Esta sección está en construcción. Pronto estará disponible.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
