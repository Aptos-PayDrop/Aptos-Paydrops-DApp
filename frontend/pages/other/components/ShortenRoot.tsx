import { CopyIcon } from "@/components/icons/copy";
import { Button } from "@/components/ui/button";


export function ShortenRoot(props: { root: string, notifyClicker: CallableFunction }) {
  return <div>
    {props.root.substring(0, 5)}...{props.root.substring(props.root.length - 5, props.root.length)} <Button style={{ cursor: "pointer" }} onClick={() => {
      navigator.clipboard.writeText(props.root);
      props.notifyClicker()
    }} size={"icon"} variant={"icon"}><CopyIcon width={20} height={20} /></Button>
  </div>
}

