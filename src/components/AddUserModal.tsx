import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUsers } from "@/hooks/useUsers";
import { Loader2 } from "lucide-react";
import { useAppT } from "@/hooks/useAppT";

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddUserModal({ open, onClose }: AddUserModalProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "operador" | "area_comercial">("operador");
  const t = useAppT();

  const { convidarUser } = useUsers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !email || !role) {
      return;
    }

    await convidarUser.mutateAsync({ nome, email, role: role as string });

    setNome("");
    setEmail("");
    setRole("operador");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('superadmin.addCollaboratorTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('superadmin.labelFullName')}</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={t('superadmin.placeholderFullName')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t('superadmin.labelEmail')}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="joao.silva@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t('superadmin.labelPermission')}</Label>
            <Select value={role} onValueChange={(value: "admin" | "operador" | "area_comercial") => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operador">{t('superadmin.roleOperator')}</SelectItem>
                <SelectItem value="admin">{t('superadmin.roleAdmin')}</SelectItem>
                <SelectItem value="area_comercial">{t('superadmin.roleCommercial')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>{t('superadmin.roleOperator')}: {t('superadmin.roleOperatorDesc')}</p>
              <p>{t('superadmin.roleAdmin')}: {t('superadmin.roleAdminDesc')}</p>
              <p>{t('superadmin.roleCommercial')}: {t('superadmin.roleCommercialDesc')}</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={convidarUser.isPending}>
              {convidarUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('superadmin.sendInvite')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
