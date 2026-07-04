import { useEffect, useState } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  isLoading: boolean;
}

function mapNetInfoState(state: NetInfoState): NetworkStatus {
  return {
    isConnected: Boolean(state.isConnected),
    isInternetReachable: Boolean(state.isInternetReachable ?? state.isConnected),
    isLoading: state.isConnected == null && state.isInternetReachable == null
  };
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    isLoading: true
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setStatus(mapNetInfoState(state));
    });

    void NetInfo.fetch().then((state) => {
      setStatus(mapNetInfoState(state));
    });

    return unsubscribe;
  }, []);

  return status;
}
