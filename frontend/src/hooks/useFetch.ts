import { useState, useEffect } from 'react';
import axios from '../services/axios';

export const useFetch = (url: string, deps: any[] = []) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios
      .get(url)
      .then((res) => mounted && setData(res.data.data || res.data))
      .catch((err) => mounted && setError(err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, deps);

  return { data, loading, error };
};

export const usePost = () => {
  const [loading, setLoading] = useState(false);
  const post = async (url: string, body: any) => {
    setLoading(true);
    try {
      const res = await axios.post(url, body);
      return res.data;
    } finally {
      setLoading(false);
    }
  };
  return { post, loading };
};

export const useDelete = () => {
  const [loading, setLoading] = useState(false);
  const remove = async (url: string) => {
    setLoading(true);
    try {
      const res = await axios.delete(url);
      return res.data;
    } finally {
      setLoading(false);
    }
  };
  return { remove, loading };
};
