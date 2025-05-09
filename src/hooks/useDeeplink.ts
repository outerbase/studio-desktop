import { OuterbaseProtocols } from "../../electron/constants";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Args {
  protocol: string;
  host: string;
  port: string;
  database: string;
}
export default function useDeeplink() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleDeepLink = (_event: unknown, { database }: Args) => {
      const matchRoute =
        OuterbaseProtocols.findIndex((protocol) => protocol === database) > -1;
      // currently handle only create connection route
      if (matchRoute) {
        navigate(`/connection/create/${database}`);
      }
    };

    window.outerbaseIpc.on("deep-link", handleDeepLink);
    return () => {
      window.outerbaseIpc.off("deep-link", handleDeepLink);
    };
  }, [navigate]);
}
