import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Input } from "../ui/input";

export default function CreateFolderModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <AlertDialog
      open={visible}
      onOpenChange={(openState) => {
        if (!openState) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create Folder</AlertDialogTitle>
          <AlertDialogDescription>
            Creating folder helping you to organize your database connection
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input placeholder="Folder name" />
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => {}}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => {}}>Create</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
