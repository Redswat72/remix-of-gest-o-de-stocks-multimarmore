import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUsers } from "@/hooks/useUsers";
import { Loader2 } from "lucide-react";

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddUserModal({ open, onClose }: AddUserModalProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "operador">("operador");

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
          <DialogTitle>Adicionar Colaborador</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome Completo *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João Silva"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="joao.silva@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Permissão *</Label>
            <Select value={role} onValueChange={(value: "admin" | "operador") => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operador">Operador</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Operador: Acesso básico à sua empresa</p>
              <p>Administrador: Pode gerir utilizadores da sua empresa</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={convidarUser.isPending}>
              {convidarUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enviar Convite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
