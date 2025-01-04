import { ConnectionStoreItem } from "@/lib/conn-manager-store";
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

interface Props {
  data: ConnectionStoreItem;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeletingConnectionModal({
  data,
  onClose,
  onSuccess,
}: Props) {
  return (
    <AlertDialog
      open
      onOpenChange={(openState) => {
        if (openState === false) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Connection</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the connection{" "}
            <span className="font-semibold">{data.name}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onSuccess}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
