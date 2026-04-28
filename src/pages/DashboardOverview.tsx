import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichAngebotsanfrage } from '@/lib/enrich';
import type { EnrichedAngebotsanfrage } from '@/types/enriched';
import type { Stammdaten } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StammdatenDialog } from '@/components/dialogs/StammdatenDialog';
import { AngebotsanfrageDialog } from '@/components/dialogs/AngebotsanfrageDialog';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconPencil, IconTrash, IconFileText,
  IconUsers, IconPackage, IconCalendar, IconSearch,
  IconChevronRight, IconBriefcase, IconInbox,
} from '@tabler/icons-react';

const APPGROUP_ID = '69f07f76465a5bebebf21487';
const REPAIR_ENDPOINT = '/claude/build/repair';

export default function DashboardOverview() {
  const {
    stammdaten, angebotsanfrage,
    stammdatenMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedAngebotsanfrage = enrichAngebotsanfrage(angebotsanfrage, { stammdatenMap });

  // State — ALL hooks before early returns
  const [selectedStammdaten, setSelectedStammdaten] = useState<Stammdaten | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stammdatenDialogOpen, setStammdatenDialogOpen] = useState(false);
  const [editStammdaten, setEditStammdaten] = useState<Stammdaten | null>(null);
  const [deleteStammdaten, setDeleteStammdaten] = useState<Stammdaten | null>(null);
  const [anfrageDialogOpen, setAnfrageDialogOpen] = useState(false);
  const [editAnfrage, setEditAnfrage] = useState<EnrichedAngebotsanfrage | null>(null);
  const [deleteAnfrage, setDeleteAnfrage] = useState<EnrichedAngebotsanfrage | null>(null);
  const [preselectedStammdatenId, setPreselectedStammdatenId] = useState<string | null>(null);

  const filteredStammdaten = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return stammdaten;
    return stammdaten.filter(s =>
      (s.fields.bezeichnung ?? '').toLowerCase().includes(q) ||
      (s.fields.kunden_csv ?? '').toLowerCase().includes(q)
    );
  }, [stammdaten, searchQuery]);

  const anfragenForSelected = useMemo(() => {
    if (!selectedStammdaten) return [];
    return enrichedAngebotsanfrage.filter(a => {
      const url = a.fields.stammdaten_ref;
      if (!url) return false;
      return url.endsWith(selectedStammdaten.record_id);
    });
  }, [selectedStammdaten, enrichedAngebotsanfrage]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const anfragenOhneRef = enrichedAngebotsanfrage.filter(a => !a.fields.stammdaten_ref);

  async function handleCreateStammdaten(fields: Stammdaten['fields']) {
    await LivingAppsService.createStammdatenEntry(fields);
    fetchAll();
  }

  async function handleEditStammdaten(fields: Stammdaten['fields']) {
    if (!editStammdaten) return;
    await LivingAppsService.updateStammdatenEntry(editStammdaten.record_id, fields);
    fetchAll();
    setEditStammdaten(null);
  }

  async function handleDeleteStammdaten() {
    if (!deleteStammdaten) return;
    await LivingAppsService.deleteStammdatenEntry(deleteStammdaten.record_id);
    if (selectedStammdaten?.record_id === deleteStammdaten.record_id) {
      setSelectedStammdaten(null);
    }
    fetchAll();
    setDeleteStammdaten(null);
  }

  async function handleCreateAnfrage(fields: EnrichedAngebotsanfrage['fields']) {
    await LivingAppsService.createAngebotsanfrageEntry(fields);
    fetchAll();
    setPreselectedStammdatenId(null);
  }

  async function handleEditAnfrage(fields: EnrichedAngebotsanfrage['fields']) {
    if (!editAnfrage) return;
    await LivingAppsService.updateAngebotsanfrageEntry(editAnfrage.record_id, fields);
    fetchAll();
    setEditAnfrage(null);
  }

  async function handleDeleteAnfrage() {
    if (!deleteAnfrage) return;
    await LivingAppsService.deleteAngebotsanfrageEntry(deleteAnfrage.record_id);
    fetchAll();
    setDeleteAnfrage(null);
  }

  function openNewAnfrage(stammdatenId?: string) {
    setPreselectedStammdatenId(stammdatenId ?? null);
    setEditAnfrage(null);
    setAnfrageDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Stammdaten"
          value={String(stammdaten.length)}
          description="Vorlagen gesamt"
          icon={<IconBriefcase size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Anfragen"
          value={String(angebotsanfrage.length)}
          description="Gesamt"
          icon={<IconInbox size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Mit PDF"
          value={String(angebotsanfrage.filter(a => !!a.fields.anfrage_pdf).length)}
          description="PDF vorhanden"
          icon={<IconFileText size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Ohne Vorlage"
          value={String(anfragenOhneRef.length)}
          description="Nicht zugeordnet"
          icon={<IconPackage size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[600px]">
        {/* LEFT: Stammdaten List */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-base text-foreground">Stammdaten</h2>
            <Button
              size="sm"
              onClick={() => { setEditStammdaten(null); setStammdatenDialogOpen(true); }}
              className="shrink-0"
            >
              <IconPlus size={16} className="mr-1 shrink-0" />
              <span className="hidden sm:inline">Neu</span>
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Suchen..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* List */}
          <div className="space-y-2 overflow-y-auto flex-1">
            {filteredStammdaten.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <IconBriefcase size={36} stroke={1.5} />
                <p className="text-sm">Keine Stammdaten vorhanden</p>
              </div>
            )}
            {filteredStammdaten.map(s => {
              const count = enrichedAngebotsanfrage.filter(a =>
                a.fields.stammdaten_ref?.endsWith(s.record_id)
              ).length;
              const isSelected = selectedStammdaten?.record_id === s.record_id;
              return (
                <div
                  key={s.record_id}
                  onClick={() => setSelectedStammdaten(isSelected ? null : s)}
                  className={`group relative rounded-2xl border p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate text-foreground">
                          {s.fields.bezeichnung || '(ohne Bezeichnung)'}
                        </p>
                        {count > 0 && (
                          <Badge variant="secondary" className="text-xs shrink-0">{count} Anfrage{count !== 1 ? 'n' : ''}</Badge>
                        )}
                      </div>
                      {s.fields.kunden_csv && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <IconUsers size={13} className="text-muted-foreground shrink-0" />
                          <p className="text-xs text-muted-foreground truncate">{s.fields.kunden_csv.split('\n')[0]}</p>
                        </div>
                      )}
                      {s.fields.stand_datum && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <IconCalendar size={13} className="text-muted-foreground shrink-0" />
                          <p className="text-xs text-muted-foreground">{formatDate(s.fields.stand_datum)}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); setEditStammdaten(s); setStammdatenDialogOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Bearbeiten"
                      >
                        <IconPencil size={14} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteStammdaten(s); }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Löschen"
                      >
                        <IconTrash size={14} />
                      </button>
                      <IconChevronRight size={14} className={`text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Angebotsanfragen Detail */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-base text-foreground">
              {selectedStammdaten
                ? <span className="truncate max-w-[220px] block">{selectedStammdaten.fields.bezeichnung || 'Angebotsanfragen'}</span>
                : 'Alle Anfragen'}
            </h2>
            <Button
              size="sm"
              onClick={() => openNewAnfrage(selectedStammdaten?.record_id)}
              className="shrink-0"
            >
              <IconPlus size={16} className="mr-1 shrink-0" />
              <span className="hidden sm:inline">Anfrage</span>
            </Button>
          </div>

          {/* Anfragen List */}
          <div className="space-y-2 overflow-y-auto flex-1">
            {(selectedStammdaten ? anfragenForSelected : enrichedAngebotsanfrage).length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground rounded-2xl border border-dashed border-border">
                <IconInbox size={40} stroke={1.5} />
                <p className="text-sm font-medium">Keine Anfragen vorhanden</p>
                {selectedStammdaten && (
                  <p className="text-xs text-center max-w-xs">
                    Noch keine Angebotsanfrage für diese Vorlage. Klicke auf „Anfrage", um eine zu erstellen.
                  </p>
                )}
              </div>
            )}

            {(selectedStammdaten ? anfragenForSelected : enrichedAngebotsanfrage).map(a => (
              <AnfrageCard
                key={a.record_id}
                anfrage={a}
                onEdit={() => { setEditAnfrage(a); setAnfrageDialogOpen(true); }}
                onDelete={() => setDeleteAnfrage(a)}
              />
            ))}
          </div>

          {/* Unassigned hint when showing all */}
          {!selectedStammdaten && anfragenOhneRef.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 flex items-center gap-2">
              <IconAlertCircle size={14} className="shrink-0" />
              <span>{anfragenOhneRef.length} Anfrage{anfragenOhneRef.length !== 1 ? 'n' : ''} ohne Stammdaten-Referenz</span>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <StammdatenDialog
        open={stammdatenDialogOpen}
        onClose={() => { setStammdatenDialogOpen(false); setEditStammdaten(null); }}
        onSubmit={editStammdaten ? handleEditStammdaten : handleCreateStammdaten}
        defaultValues={editStammdaten?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Stammdaten']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Stammdaten']}
      />

      <AngebotsanfrageDialog
        open={anfrageDialogOpen}
        onClose={() => { setAnfrageDialogOpen(false); setEditAnfrage(null); setPreselectedStammdatenId(null); }}
        onSubmit={editAnfrage ? handleEditAnfrage : handleCreateAnfrage}
        defaultValues={
          editAnfrage
            ? editAnfrage.fields
            : preselectedStammdatenId
              ? { stammdaten_ref: createRecordUrl(APP_IDS.STAMMDATEN, preselectedStammdatenId) }
              : undefined
        }
        stammdatenList={stammdaten}
        enablePhotoScan={AI_PHOTO_SCAN['Angebotsanfrage']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Angebotsanfrage']}
      />

      <ConfirmDialog
        open={!!deleteStammdaten}
        title="Stammdaten löschen"
        description={`Sollen die Stammdaten „${deleteStammdaten?.fields.bezeichnung || 'Eintrag'}" wirklich gelöscht werden?`}
        onConfirm={handleDeleteStammdaten}
        onClose={() => setDeleteStammdaten(null)}
      />

      <ConfirmDialog
        open={!!deleteAnfrage}
        title="Anfrage löschen"
        description="Soll diese Angebotsanfrage wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleDeleteAnfrage}
        onClose={() => setDeleteAnfrage(null)}
      />
    </div>
  );
}

function AnfrageCard({
  anfrage,
  onEdit,
  onDelete,
}: {
  anfrage: EnrichedAngebotsanfrage;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hasJson = !!anfrage.fields.ergebnis_json;
  const hasPdf = !!anfrage.fields.anfrage_pdf;
  const hasNotes = !!anfrage.fields.notizen;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="flex-1 min-w-0">
          {anfrage.stammdaten_refName && (
            <p className="text-xs text-primary font-medium truncate mb-1">{anfrage.stammdaten_refName}</p>
          )}

          <div className="flex flex-wrap gap-1.5 mt-1">
            {hasPdf && (
              <a
                href={anfrage.fields.anfrage_pdf}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
              >
                <IconFileText size={12} className="shrink-0" />
                PDF öffnen
              </a>
            )}
            {hasJson && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                <IconCheck size={12} className="shrink-0" />
                Ergebnis vorhanden
              </span>
            )}
            {!hasPdf && !hasJson && (
              <span className="text-xs text-muted-foreground">Noch kein Inhalt</span>
            )}
          </div>

          {hasNotes && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{anfrage.fields.notizen}</p>
          )}

          <p className="mt-2 text-xs text-muted-foreground">
            Erstellt {formatDate(anfrage.createdat)}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Bearbeiten"
          >
            <IconPencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Löschen"
          >
            <IconTrash size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full rounded-xl" />
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <div className="lg:col-span-3 space-y-2">
          <Skeleton className="h-8 w-32" />
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
