import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FC } from "react";
import { Button } from "./button";

export const LabeledInput: FC<{
  label: string;
  required?: boolean;
  tooltip: string;
  disabled?: boolean;
  value?: number | string;
  type?: "number" | "text";
  id: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({
  label,
  required,
  tooltip,
  disabled,
  value,
  onChange,
  id,
  type = "number",
}) => {
    return (
      <div className="flex flex-col item-center space-y-4 mt-4">
        <Label htmlFor={id} tooltip={tooltip}>
          {label} {required ? "" : "(optional)"}
        </Label>
        <Input
          disabled={disabled}
          type={type}
          id={id}
          value={value}
          onChange={onChange}
        />
      </div>
    );
  };


export const LabeledInputWithButton: FC<{
  label: string;
  required?: boolean;
  tooltip: string;
  disabled?: boolean;
  value?: number | string;
  type?: "number" | "text";
  id: string;
  btnClick?: () => void,
  btnText?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({
  label,
  required,
  tooltip,
  disabled,
  value,
  onChange,
  id,
  type = "number",
  btnClick,
  btnText
}) => {
    return (
      <div className="flex flex-col item-center space-y-4 mt-4">
        <Label htmlFor={id} tooltip={tooltip}>
          {label} {required ? "" : "(optional)"}
        </Label>
        <div className="flex flex-row ">
          <Input
            disabled={disabled}
            type={type}
            id={id}
            value={value}
            onChange={onChange}
          />
          <Button className="ml-2" onClick={btnClick}>{btnText}</Button>
        </div>
      </div>
    );
  };
