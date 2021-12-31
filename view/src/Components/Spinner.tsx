import React, { SVGProps } from "react";
import "../styles/Spinner.less";

const Spinner = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <div className={className} styleName="loading">
    <svg stroke="currentColor" strokeWidth=".8rem" viewBox="0 0 150 150" {...props} styleName="spinner">
      <circle cx="75" cy="75" r="60" />
    </svg>
  </div>
);

export default Spinner;
