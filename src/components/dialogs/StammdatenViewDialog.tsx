import type { Stammdaten } from '@/types/app';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface StammdatenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Stammdaten | null;
  onEdit: (record: Stammdaten) => void;
}

export function StammdatenViewDialog({ open, onClose, record, onEdit }: StammdatenViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stammdaten anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kunden CSV</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.kunden_csv ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ansprechpartner CSV</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.ansprechpartner_csv ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Artikel CSV</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.artikel_csv ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bezeichnung / Version</Label>
            <p className="text-sm">{record.fields.bezeichnung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Stand-Datum</Label>
            <p className="text-sm">{formatDate(record.fields.stand_datum)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}