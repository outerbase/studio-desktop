import { Toolbar, ToolbarBackButton, ToolbarTitle } from "@/components/toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DatabaseInstanceStoreItem,
  DatabaseManagerStore,
} from "@/lib/db-manager-store";
import { MySQLIcon } from "@/lib/outerbase-icon";
import { useNavigate } from "react-router-dom";
import { useImmer } from "use-immer";

export function SqlServerInstance() {
  const [data, setData] = useImmer<DatabaseInstanceStoreItem>(() => ({
    id: "mssql-" + DatabaseManagerStore.generateShortId(),
    name: "MS SSQL Local",
    type: "mssql",
    version: "2017-CU11-ubuntu",
    config: {
      port: "1433",
      username: "sa",
      password: "yourStrong(!)Password",
    },
  }));
  const navigate = useNavigate();

  return (
    <div>
      <Toolbar>
        <ToolbarBackButton />
        <ToolbarTitle text="Create PostgresSQL Database" icon={MySQLIcon} />
      </Toolbar>

      <div className="flex flex-col gap-4 p-8">
        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <Label>Name</Label>
            <Input
              value={data.name}
              onChange={(e) =>
                setData((d) => {
                  d.name = e.target.value;
                })
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Version</Label>
            <Select
              value={data.version}
              onValueChange={(v) => {
                setData((d) => {
                  d.version = v;
                });
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2017-CU11-ubuntu">
                  2017-CU11-ubuntu
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <Label>Username</Label>
            <Input value={data.config.username} readOnly disabled />
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <Label>Password</Label>
            <Input
              value={data.config.password}
              onChange={(e) =>
                setData((d) => {
                  d.config.password = e.target.value;
                })
              }
            />
          </div>

          <div className="flex w-[150px] flex-col gap-2">
            <Label>Port</Label>
            <Input
              value={data.config.port}
              onChange={(e) =>
                setData((d) => {
                  d.config.port = e.target.value;
                })
              }
            />
          </div>
        </div>

        <div className="mt-8">
          <Button
            onClick={() => {
              DatabaseManagerStore.add(data);
              navigate(-1);
            }}
          >
            Launch
          </Button>
        </div>
      </div>
    </div>
  );
}
