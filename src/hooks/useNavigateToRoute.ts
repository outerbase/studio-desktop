import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function useNavigateToRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    const navigateToHandler = (_: Electron.IpcRendererEvent, route: string) => {
      navigate(route);
    };

    window.outerbaseIpc.on("navigate-to", navigateToHandler);

    return () => {
      window.outerbaseIpc.off("navigate-to", navigateToHandler);
    };
  }, [navigate]);
}
