import React from 'react';
import { useLocation } from 'react-router-dom';
import NormalProfile from '../pages/NormalProfile';
import RotationProfile from '../pages/RotationProfile';

function ProfileRouter() {
  const location = useLocation();
  const type = location.state?.type;

  if (type === 'rotation') {
    return <RotationProfile />;
  }

  return <NormalProfile />;
}

export default ProfileRouter;