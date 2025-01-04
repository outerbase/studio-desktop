import { useEffect, useState } from "react";

export default function useWindowDimension() {
  const [dimension, setDimension] = useState<{ width: number; height: number }>(
    {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  );
  useEffect(() => {
    const handleResize = () => {
      setDimension({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return dimension;
}
