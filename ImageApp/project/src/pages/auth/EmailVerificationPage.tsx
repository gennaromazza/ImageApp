import React from 'react';
import { useLocation } from 'react-router-dom';
import EmailVerification from '../../components/auth/EmailVerification';

interface LocationState {
  returnTo?: string;
  selectedPlan?: string;
}

const EmailVerificationPage = () => {
  const location = useLocation();
  const { returnTo, selectedPlan } = (location.state as LocationState) || {};

  return (
    <EmailVerification returnTo={returnTo} selectedPlan={selectedPlan} />
  );
};

export default EmailVerificationPage;