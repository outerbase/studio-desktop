import { FolderIcon } from "lucide-react";
import { Button } from "./ui/button";
import CreateFolderModal from "./database/create-folder-modal";
import { useState } from "react";

interface Props {}
export default function CreateFolderButton(props: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <Button onClick={() => setVisible(true)} variant="ghost">
        <FolderIcon size={16} />
        <p className="text-md">New Folder</p>
      </Button>
      <CreateFolderModal visible={visible} onClose={() => setVisible(false)} />
    </div>
  );
}
