import type { UpdateInfo, ProgressInfo } from "electron-updater";
import { LucideLoader } from "lucide-react";
import { useEffect, useState } from "react";

type UpdateStage =
  | "checking"
  | "avaliable"
  | "downloading"
  | "complete"
  | "latest";

export default function UpdateBar() {
  const [stage, setStage] = useState<UpdateStage>("checking");
  const [progress, setProgress] = useState<ProgressInfo>();
  const [latestVersion, setLatestVersion] = useState<UpdateInfo>();

  // Update is not avaliable
  useEffect(() => {
    const handler = () => {
      setStage("latest");
    };

    window.outerbaseIpc.on("update-not-available", handler);
    return () => {
      window.outerbaseIpc.off("update-not-available", handler);
    };
  }, []);

  useEffect(() => {
    const handler = (_: unknown, updateInfo: UpdateInfo) => {
      setStage("avaliable");
      setLatestVersion(updateInfo);
    };

    window.outerbaseIpc.on("update-available", handler);

    return () => {
      window.outerbaseIpc.off("update-available", handler);
    };
  }, []);

  // Progress bar
  useEffect(() => {
    const handler = (_: unknown, info: ProgressInfo) => {
      setProgress(info);
    };

    window.outerbaseIpc.on("update-download-progress", handler);

    return () => {
      window.outerbaseIpc.off("update-download-progress", handler);
    };
  }, []);

  // Completed event
  useEffect(() => {
    const handler = () => {
      setStage("complete");
    };

    window.outerbaseIpc.on("update-downloaded", handler);

    return () => {
      window.outerbaseIpc.off("update-downloaded", handler);
    };
  }, []);

  if (stage === "checking") {
    return (
      <div className="flex items-center justify-end pr-2">
        <LucideLoader
          className="mr-2 inline-block h-4 w-4 animate-spin"
          size={16}
        />
        Checking for update
      </div>
    );
  }

  if (stage === "complete") {
    return (
      <div className="flex items-center justify-end pr-2">
        Update downloaded.{"  "}
        <span
          className="cursor-pointer underline"
          onClick={() => {
            window.outerbaseIpc.restart();
          }}
        >
          Click to restart and update
        </span>
      </div>
    );
  }

  if (stage === "latest") {
    return (
      <div className="flex items-center justify-end pr-2">Latest version</div>
    );
  }

  if (stage === "avaliable" && latestVersion) {
    return (
      <div className="flex items-center justify-end pr-2">
        New version avaliable: {latestVersion.version}.{"  "}
        <span
          className="cursor-pointer underline"
          onClick={() => {
            setStage("downloading");
            window.outerbaseIpc.downloadUpdate();
          }}
        >
          Update now
        </span>
      </div>
    );
  }

  if (progress || stage === "downloading") {
    return (
      <div className="flex items-center justify-end pr-2">
        <LucideLoader
          className="mr-2 inline-block h-4 w-4 animate-spin"
          size={16}
        />
        Downloading update {progress?.percent.toFixed(2) || "0"}%
      </div>
    );
  }

  return <div className="flex items-center justify-end pr-2"></div>;
}
