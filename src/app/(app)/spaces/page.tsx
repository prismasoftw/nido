import type { Metadata } from "next";
import { Building2, MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";

import { requireOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/auth";
import { RESOURCE_KIND_LABELS } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { getPlanCatalog } from "@/lib/plans-server";
import { deleteResourceAction } from "@/lib/actions/spaces";
import type { Location, Resource } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LocationDialog } from "@/components/spaces/location-dialog";
import { ResourceDialog } from "@/components/spaces/resource-dialog";
import { PlanLimitAlert, atLimit } from "@/components/plan/plan-limit-alert";

export const metadata: Metadata = { title: "Espacios" };

function priceLabel(r: Resource): string {
  const parts: string[] = [];
  if (r.price_hour) parts.push(`${formatMoney(r.price_hour)}/h`);
  if (r.price_day) parts.push(`${formatMoney(r.price_day)}/día`);
  if (r.price_week) parts.push(`${formatMoney(r.price_week)}/sem`);
  if (r.price_month) parts.push(`${formatMoney(r.price_month)}/mes`);
  return parts.join(" · ") || "Sin tarifa";
}

export default async function SpacesPage() {
  const { org, role } = await requireOrg();
  const admin = isAdminRole(role);
  const supabase = await createClient();

  const [{ data: locationsData }, { data: resourcesData }] = await Promise.all([
    supabase
      .from("locations")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("resources")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: true }),
  ]);

  const locations = (locationsData ?? []) as Location[];
  const resources = (resourcesData ?? []) as Resource[];
  const locationOptions = locations.map((l) => ({ id: l.id, name: l.name }));

  const limits = (await getPlanCatalog())[org.plan].limits;
  const atLocationLimit = atLimit(locations.length, limits.locations);
  const atResourceLimit = atLimit(resources.length, limits.resources);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">Espacios</h1>
          <p className="text-muted-foreground text-sm">
            Administra tus sedes y los espacios reservables de cada una.
          </p>
        </div>
        {admin && (
          <div className="flex gap-2">
            {atLocationLimit ? (
              <Button variant="outline" size="sm" disabled>
                <Building2 className="size-4" />
                Nueva sede
              </Button>
            ) : (
              <LocationDialog
                trigger={
                  <Button variant="outline" size="sm">
                    <Building2 className="size-4" />
                    Nueva sede
                  </Button>
                }
              />
            )}
            {locations.length > 0 &&
              (atResourceLimit ? (
                <Button size="sm" disabled>
                  <Plus className="size-4" />
                  Nuevo espacio
                </Button>
              ) : (
                <ResourceDialog
                  locations={locationOptions}
                  trigger={
                    <Button size="sm">
                      <Plus className="size-4" />
                      Nuevo espacio
                    </Button>
                  }
                />
              ))}
          </div>
        )}
      </div>

      {admin && (
        <>
          <PlanLimitAlert
            used={locations.length}
            max={limits.locations}
            noun="sedes"
          />
          <PlanLimitAlert
            used={resources.length}
            max={limits.resources}
            noun="espacios"
          />
        </>
      )}

      {locations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
              <Building2 className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Aún no tienes sedes</p>
              <p className="text-muted-foreground text-sm">
                Crea tu primera sede para empezar a agregar espacios.
              </p>
            </div>
            {admin && (
              <LocationDialog
                trigger={
                  <Button>
                    <Plus className="size-4" />
                    Crear sede
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {locations.map((location) => {
            const locResources = resources.filter(
              (r) => r.location_id === location.id,
            );
            return (
              <section key={location.id} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-lg font-semibold">
                      {location.name}
                    </h2>
                    {!location.is_active && (
                      <Badge variant="outline">Inactiva</Badge>
                    )}
                    {location.city && (
                      <span className="text-muted-foreground flex items-center gap-1 text-xs">
                        <MapPin className="size-3" />
                        {location.city}
                      </span>
                    )}
                  </div>
                  {admin && (
                    <div className="flex gap-2">
                      <LocationDialog
                        location={location}
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Pencil className="size-4" />
                            Editar sede
                          </Button>
                        }
                      />
                      {atResourceLimit ? (
                        <Button variant="outline" size="sm" disabled>
                          <Plus className="size-4" />
                          Espacio
                        </Button>
                      ) : (
                        <ResourceDialog
                          locations={locationOptions}
                          defaultLocationId={location.id}
                          trigger={
                            <Button variant="outline" size="sm">
                              <Plus className="size-4" />
                              Espacio
                            </Button>
                          }
                        />
                      )}
                    </div>
                  )}
                </div>

                {locResources.length === 0 ? (
                  <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
                    Sin espacios en esta sede todavía.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {locResources.map((r) => (
                      <Card key={r.id} className={r.is_active ? "" : "opacity-60"}>
                        <CardContent className="space-y-2 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{r.name}</p>
                              <Badge variant="secondary" className="mt-1">
                                {RESOURCE_KIND_LABELS[r.kind]}
                              </Badge>
                            </div>
                            {admin && (
                              <div className="flex">
                                <ResourceDialog
                                  locations={locationOptions}
                                  resource={r}
                                  trigger={
                                    <Button variant="ghost" size="icon" className="size-8">
                                      <Pencil className="size-4" />
                                    </Button>
                                  }
                                />
                                <form action={deleteResourceAction}>
                                  <input type="hidden" name="id" value={r.id} />
                                  <Button
                                    type="submit"
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive size-8"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </form>
                              </div>
                            )}
                          </div>
                          <div className="text-muted-foreground flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1">
                              <Users className="size-3" />
                              {r.capacity}
                            </span>
                            {!r.is_active && <span>Inactivo</span>}
                          </div>
                          <p className="text-sm font-medium">{priceLabel(r)}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
