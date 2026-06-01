import React, { useState, useRef } from 'react';

const generateTxnId = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${y}${m}${d}-${rand}`;
};

const PaymentModal = ({ monto, nombreServicio, onSuccess, onClose }) => {
  const [step, setStep] = useState('form');
  const [txnId, setTxnId] = useState('');
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: '',
  });
  const [errors, setErrors] = useState({});
  const btnRef = useRef(null);

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return digits.slice(0, 2) + '/' + digits.slice(2);
    }
    return digits;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formatted = value;
    if (name === 'cardNumber') formatted = formatCardNumber(value);
    if (name === 'cardExpiry') formatted = formatExpiry(value);
    if (name === 'cardCvc') formatted = value.replace(/\D/g, '').slice(0, 3);
    setFormData(prev => ({ ...prev, [name]: formatted }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    const cardDigits = formData.cardNumber.replace(/\s/g, '');
    if (cardDigits.length !== 16) newErrors.cardNumber = 'Ingresa 16 dígitos';
    const expDigits = formData.cardExpiry.replace('/', '');
    if (expDigits.length !== 4) newErrors.cardExpiry = 'MM/AA inválido';
    if (formData.cardCvc.length !== 3) newErrors.cardCvc = 'CVC inválido';
    if (!formData.cardName.trim()) newErrors.cardName = 'Ingresa el titular';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const id = generateTxnId();
    setTxnId(id);
    setStep('processing');

    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess(id);
      }, 2000);
    }, 2200);
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('payment-modal-overlay') && step === 'form') {
      onClose();
    }
  };

  return (
    <div className="payment-modal-overlay" onClick={handleOverlayClick}>
      <div className="payment-modal">
        <button className="payment-modal-close" onClick={onClose} disabled={step !== 'form'}>
          ×
        </button>

        {step === 'form' && (
          <>
            <div className="payment-modal-header">
              <span className="payment-modal-icon">💳</span>
              <h2>Pago del servicio</h2>
              <p className="payment-modal-service">{nombreServicio}</p>
              <p className="payment-modal-amount">${parseFloat(monto).toFixed(2)}</p>
            </div>

            <form className="payment-form" onSubmit={handleSubmit}>
              <div className="card-preview">
                <div className="card-preview-brand">💳</div>
                <div className="card-preview-number">
                  {formData.cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div className="card-preview-bottom">
                  <span>{formData.cardName || 'TITULAR'}</span>
                  <span>{formData.cardExpiry || 'MM/AA'}</span>
                </div>
              </div>

              <div className="payment-field">
                <label>Número de tarjeta</label>
                <input
                  name="cardNumber"
                  placeholder="4242 4242 4242 4242"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  autoComplete="cc-number"
                  className={errors.cardNumber ? 'field-error' : ''}
                />
                {errors.cardNumber && <span className="field-error-msg">{errors.cardNumber}</span>}
              </div>

              <div className="payment-row">
                <div className="payment-field">
                  <label>Vencimiento</label>
                  <input
                    name="cardExpiry"
                    placeholder="MM/AA"
                    value={formData.cardExpiry}
                    onChange={handleChange}
                    autoComplete="cc-exp"
                    className={errors.cardExpiry ? 'field-error' : ''}
                  />
                  {errors.cardExpiry && <span className="field-error-msg">{errors.cardExpiry}</span>}
                </div>
                <div className="payment-field">
                  <label>CVC</label>
                  <input
                    name="cardCvc"
                    placeholder="123"
                    value={formData.cardCvc}
                    onChange={handleChange}
                    autoComplete="cc-csc"
                    className={errors.cardCvc ? 'field-error' : ''}
                  />
                  {errors.cardCvc && <span className="field-error-msg">{errors.cardCvc}</span>}
                </div>
              </div>

              <div className="payment-field">
                <label>Titular de la tarjeta</label>
                <input
                  name="cardName"
                  placeholder="Juan Pérez"
                  value={formData.cardName}
                  onChange={handleChange}
                  autoComplete="cc-name"
                  className={errors.cardName ? 'field-error' : ''}
                />
                {errors.cardName && <span className="field-error-msg">{errors.cardName}</span>}
              </div>

              <button ref={btnRef} type="submit" className="payment-submit">
                Pagar ${parseFloat(monto).toFixed(2)}
              </button>

              <p className="payment-disclaimer">
                💳 Pago 100% simulado · Proyecto escolar
              </p>
            </form>
          </>
        )}

        {step === 'processing' && (
          <div className="payment-processing">
            <div className="spinner"></div>
            <h2>Procesando pago seguro...</h2>
            <p>No cierres esta ventana</p>
            <div className="processing-bar">
              <div className="processing-bar-fill"></div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="payment-success">
            <div className="checkmark-container">
              <svg className="checkmark" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <h2>Pago confirmado</h2>
            <p className="payment-success-txn">ID: {txnId}</p>
            <p className="payment-success-amount">${parseFloat(monto).toFixed(2)}</p>
            <div className="payment-success-message">
              Redirigiendo...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;