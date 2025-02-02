import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function useDeeplink() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleDeepLink = (_: unknown, url: URL) => {
      try {
        // Example: Extract database type and connection details
        const urlObj = new URL(url);
        const protocol = urlObj.protocol.replace(":", ""); // mysql, postgres, outerbase
        const host = urlObj.hostname;
        const port = urlObj.port || (protocol === "mysql" ? 3306 : 5432);
        const database = urlObj.pathname.replace("/", "");

        console.log("Protocol:", protocol);
        console.log("Host:", host);
        console.log("Port:", port);
        console.log("Database:", database);
        navigate(`/connection/create/${protocol}`);
      } catch (error) {
        console.error("Failed to handle deep link:", error);
      }
    };

    window.outerbaseIpc.on("deep-link", handleDeepLink);
    return () => {
      window.outerbaseIpc.off("deep-link", handleDeepLink);
    };
  }, [navigate]);
}
