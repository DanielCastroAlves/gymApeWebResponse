import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, ...props }) => {
  return (
    <div className="inputContainer">
      {label && <label className="inputLabel">{label}</label>}
      <input className="inputField" {...props} />
      {error && <span className="inputError">{error}</span>}
    </div>
  );
};

export default Input;
