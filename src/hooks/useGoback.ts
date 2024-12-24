import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function useGoback() {
  const navigate = useNavigate();

  const goBack = useCallback(() => {
    const canGoBack = window.history.length > 1;
    if (canGoBack) {
      navigate(-1);
    } else {
      navigate("/connection");
    }
  }, [navigate]);

  return goBack;
}
