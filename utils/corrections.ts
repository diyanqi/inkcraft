import { createClient } from '@supabase/supabase-js';

// 批改记录类型定义
export interface Correction {
  id?: bigint;
  uuid?: string;
  title: string;
  icon: string;
  model: string;
  content: string;
  score: number;
  user_email: string;
  public: boolean;
  type: string;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

// 批改工具类
export class CorrectionUtil {
  private supabase;

  constructor() {
    // 初始化 Supabase 客户端
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // 创建新的批改记录
  async create(correction: Omit<Correction, 'id' | 'uuid' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await this.supabase
        .from('corrections')
        .insert([{
          ...correction,
          public: correction.public ?? false,
          type: correction.type ?? 'gaokao-english-continuation',
          status: correction.status ?? 'success'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('创建批改记录失败:', error);
      throw error;
    }
  }

  // 获取指定用户的批改记录，可选择限制返回数量
  async getByUserEmail(userEmail: string, limit?: number, skip?: number) {
    try {
      let query = this.supabase
        .from('corrections')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });
      
      if (skip !== undefined) {
        query = query.range(skip, skip + (limit || 100) - 1);
      } else if (limit !== undefined) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('获取批改记录失败:', error);
      throw error;
    }
  }

  // 获取单个批改记录
  async getById(id: number) {
    try {
      const { data, error } = await this.supabase
        .from('corrections')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('获取批改记录失败:', error);
      throw error;
    }
  }

  // 通过 UUID 获取单个批改记录
  async getByUuid(uuid: string) {
    try {
      const { data, error } = await this.supabase
        .from('corrections')
        .select('*')
        .eq('uuid', uuid)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('获取批改记录失败:', error);
      throw error;
    }
  }

  // 更新批改记录
  async update(id: number, correction: Partial<Omit<Correction, 'id' | 'uuid' | 'created_at' | 'updated_at'>>) {
    try {
      const { data, error } = await this.supabase
        .from('corrections')
        .update(correction)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('更新批改记录失败:', error);
      throw error;
    }
  }

  // 通过 UUID 更新批改记录
  async updateByUuid(uuid: string, correction: Partial<Omit<Correction, 'id' | 'uuid' | 'created_at' | 'updated_at'>>) {
    try {
      const { data, error } = await this.supabase
        .from('corrections')
        .update(correction)
        .eq('uuid', uuid)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('更新批改记录失败:', error);
      throw error;
    }
  }

  // 删除批改记录
  async delete(id: number) {
    try {
      const { error } = await this.supabase
        .from('corrections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('删除批改记录失败:', error);
      throw error;
    }
  }

  // 通过 UUID 删除批改记录
  async deleteByUuid(uuid: string) {
    try {
      const { error } = await this.supabase
        .from('corrections')
        .delete()
        .eq('uuid', uuid);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('删除批改记录失败:', error);
      throw error;
    }
  }
}