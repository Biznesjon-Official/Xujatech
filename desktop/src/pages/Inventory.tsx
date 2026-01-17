import React from 'react';
import { useLanguage } from '../i18n';

const Inventory: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('nav.inventory')}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">{t('common.loading')}</p>
      </div>
    </div>
  );
};

export default Inventory;
