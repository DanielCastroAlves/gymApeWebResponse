import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, ...props }) => {
  return (
    <div className="inputContainer">
      <input
        className="inputField"
        {...props}
        placeholder=" " /* Placeholder vazio para ativar a label dinâmica */
      />
      {label && <label className="inputLabel">{label}</label>}
      {error && <span className="inputError">{error}</span>}
    </div>
  );
};

export default Input;
