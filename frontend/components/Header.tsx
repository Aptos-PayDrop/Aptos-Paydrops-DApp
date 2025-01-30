import { IS_DEV } from "@/constants";
import { Link } from "react-router-dom";
import { WalletSelector } from "./WalletSelector";
import { buttonVariants } from "./ui/button";
import { Text } from "@radix-ui/themes";

export function Header({ title }: { title: string }) {

  return (
    <div className="flex items-center justify-between px-4 py-2 max-w-screen-xl mx-auto w-full flex-wrap">
      <div className="flex justify-start">
        <img width="40" style={{ scale: "0.8", marginTop: "-5px" }} src={`${window.location.origin}/logo.webp`} />
        <h1 className="display">
          <Link className="mx-auto" style={{ top: "50%" }} to="/">{title}</Link>
        </h1>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        {IS_DEV && (
          <>
            <Link className={buttonVariants({ variant: "link" })} to={"/"}>
              <Text >Claim Paydrops</Text>
            </Link>
            <Link className={buttonVariants({ variant: "link" })} to={"/create-droptree"}>
              Fund Paydrops
            </Link>
          </>
        )}

        <WalletSelector />
      </div>
    </div>
  );
}
