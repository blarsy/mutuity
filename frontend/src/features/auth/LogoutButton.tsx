import { Button, type ButtonProps } from "@mui/material";
import { useRouter } from "next/router";
import { useState } from "react";

import { useAuth } from "./AuthProvider";

type LogoutButtonProps = Omit<ButtonProps, "onClick"> & {
  redirectTo?: string;
};

export function LogoutButton({ redirectTo = "/login", children, ...buttonProps }: LogoutButtonProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    try {
      setIsPending(true);
      await signOut();
      await router.push(redirectTo);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button {...buttonProps} disabled={buttonProps.disabled || isPending} onClick={() => void handleClick()}>
      {children ?? "Sign out"}
    </Button>
  );
}
