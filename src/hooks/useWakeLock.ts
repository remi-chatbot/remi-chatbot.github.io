const useWakeLock = () => {
  const wakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log('Wake Lock is active');
        return wakeLock;
      } else {
        console.log('Wake Lock API is not supported');
        return null;
      }
    } catch (err) {
      console.error('Wake Lock request failed:', err);
      return null;
    }
  };

  return { wakeLock };
};

export default useWakeLock; 