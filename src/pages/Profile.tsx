import { useState } from "react";
import { User, Mail, Phone, Building2, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function Profile() {
  const [profile, setProfile] = useState({
    name: "Eliezer",
    email: "eliezer@empresa.com",
    phone: "+55 11 99999-9999",
    organization: "Empresa XYZ",
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleSaveProfile = () => {
    toast.success("Perfil atualizado com sucesso!");
  };

  const handleChangePassword = () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    toast.success("Senha alterada com sucesso!");
    setPasswords({ current: "", new: "", confirm: "" });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas informações pessoais
        </p>
      </div>

      {/* Profile Card */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center gap-4 pb-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/20 text-primary text-2xl">
              EL
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-foreground">{profile.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <Button variant="outline" size="sm" className="mt-2">
              Alterar foto
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome
              </Label>
              <Input
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                className="bg-muted/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-mail
              </Label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                className="bg-muted/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone
              </Label>
              <Input
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                className="bg-muted/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Organização
              </Label>
              <Input
                value={profile.organization}
                disabled
                className="bg-muted/30 border-border text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSaveProfile}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Save className="h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Senha Atual</Label>
            <Input
              type="password"
              value={passwords.current}
              onChange={(e) =>
                setPasswords({ ...passwords, current: e.target.value })
              }
              className="bg-muted/50 border-border"
            />
          </div>
          <Separator className="bg-border" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                value={passwords.new}
                onChange={(e) =>
                  setPasswords({ ...passwords, new: e.target.value })
                }
                className="bg-muted/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <Input
                type="password"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirm: e.target.value })
                }
                className="bg-muted/50 border-border"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={handleChangePassword}
              className="gap-2"
            >
              <Lock className="h-4 w-4" />
              Alterar Senha
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
