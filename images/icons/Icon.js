import * as React from "react";
const SvgIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={512} height={512} {...props}>
    <path fill="#2196f3" d="M0 0h512v512H0z" />
    <g fill="#fff">
      <circle cx={256} cy={256} r={120} />
      <path d="M256 96A160 160 0 0 0 96 256a160 160 0 0 0 160 160 160 160 0 0 0 160-160A160 160 0 0 0 256 96m0 40a120 120 0 0 1 120 120 120 120 0 0 1-120 120 120 120 0 0 1-120-120 120 120 0 0 1 120-120" />
    </g>
  </svg>
);
export default SvgIcon;
