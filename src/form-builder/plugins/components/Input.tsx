import { Input, type InputProps } from "antd";

type InputAntProps = InputProps & {
  _invalid?: boolean;
  _errorMessage?: string;
};

const InputAnt = ({ _invalid, _errorMessage, ...props }: InputAntProps) => (
  <Input {...props} status={_invalid ? "error" : props.status} />
);

export default InputAnt;
