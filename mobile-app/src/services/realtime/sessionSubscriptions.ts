export interface SessionSubscriptionHandle {
  stop: () => void;
}

export function startSessionSubscriptions(): SessionSubscriptionHandle {
  const intervalId = setInterval(() => {
    return;
  }, 30_000);

  return {
    stop: () => clearInterval(intervalId)
  };
}
