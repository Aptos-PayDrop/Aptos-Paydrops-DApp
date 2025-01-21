import { IS_DEV } from "@/constants";
import { Link } from "react-router-dom";
import { WalletSelector } from "./WalletSelector";
import { buttonVariants } from "./ui/button";

export function Header({title}: {title: string}) {

  return (
    <div className="flex items-center justify-between px-4 py-2 max-w-screen-xl mx-auto w-full flex-wrap">
      <h1 className="display">
        <Link to="/">{title}</Link>
      </h1>

      <div className="flex gap-2 items-center flex-wrap">
        {IS_DEV && (
          <>
          <Link className={buttonVariants({ variant: "link" })} to={"/"}>
          Claim Paydrops
        </Link>
            <Link className={buttonVariants({ variant: "link" })} to={"/my-assets"}>
              History
            </Link>
            <Link className={buttonVariants({ variant: "link" })} to={"/create-asset"}>
              Fund Paydrops
            </Link>
          </>
        )}

        <WalletSelector />
      </div>
    </div>
  );
}
