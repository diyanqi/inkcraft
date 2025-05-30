import { createClient, SupabaseClient } from '@supabase/supabase-js'; // 引入 SupabaseClient 类型

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
  private supabase: SupabaseClient; // 明确类型

  constructor() {
    // 初始化 Supabase 客户端
    // 确保环境变量存在，否则会抛出错误
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }
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
          // 提供默认值，如果传入的值为 undefined 或 null
          public: correction.public ?? false,
          type: correction.type ?? 'gaokao-english-continuation',
          status: correction.status ?? 'success'
        }])
        .select()
        .single();

      if (error) throw error;
      // Supabase insert/update/delete single() returns the object or null if not found after operation
      return data as Correction | null; // Cast to expected type
    } catch (error) {
      console.error('创建批改记录失败:', error);
      throw error;
    }
  }

  // 获取指定用户的批改记录，可选择限制返回数量
  async getByUserEmail(userEmail: string, limit?: number, skip?: number): Promise<Correction[] | null> {
    try {
      let query = this.supabase
        .from('corrections')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });

      if (skip !== undefined) {
        // Supabase range is inclusive [from, to]
        query = query.range(skip, skip + (limit || 100) - 1);
      } else if (limit !== undefined) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Correction[] | null; // Cast to expected type
    } catch (error) {
      console.error('获取批改记录失败:', error);
      throw error;
    }
  }

  // 获取单个批改记录
  async getById(id: number): Promise<Correction | null> {
    try {
      const { data, error } = await this.supabase
        .from('corrections')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
         // If single() returns no row, error.code is 'PGRST116'.
         // We might want to return null instead of throwing in this specific case.
         if ((error as any).code === 'PGRST116') return null;
         throw error;
      }
      return data as Correction | null; // Cast to expected type
    } catch (error) {
      console.error('获取批改记录失败:', error);
      throw error;
    }
  }

  // 通过 UUID 获取单个批改记录
  async getByUuid(uuid: string): Promise<Correction | null> {
    try {
      const { data, error } = await this.supabase
        .from('corrections')
        .select('*')
        .eq('uuid', uuid)
        .single();

      if (error) {
         if ((error as any).code === 'PGRST116') return null;
         throw error;
      }
      return data as Correction | null; // Cast to expected type
    } catch (error) {
      console.error('获取批改记录失败:', error);
      throw error;
    }
  }

  // 更新批改记录
  async update(id: number, correction: Partial<Omit<Correction, 'id' | 'uuid' | 'created_at' | 'updated_at'>>): Promise<Correction | null> {
    try {
      const { data, error } = await this.supabase
        .from('corrections')
        .update(correction)
        .eq('id', id)
        .select()
        .single();

      if (error) {
         if ((error as any).code === 'PGRST116') return null;
         throw error;
      }
      return data as Correction | null; // Cast to expected type
    } catch (error) {
      console.error('更新批改记录失败:', error);
      throw error;
    }
  }

  // 通过 UUID 更新批改记录
  async updateByUuid(uuid: string, correction: Partial<Omit<Correction, 'id' | 'uuid' | 'created_at' | 'updated_at'>>): Promise<Correction | null> {
    try {
      const { data, error } = await this.supabase
        .from('corrections')
        .update(correction)
        .eq('uuid', uuid)
        .select()
        .single();

      if (error) {
         if ((error as any).code === 'PGRST116') return null;
         throw error;
      }
      return data as Correction | null; // Cast to expected type
    } catch (error) {
      console.error('更新批改记录失败:', error);
      throw error;
    }
  }

  // 删除批改记录
  async delete(id: number): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('corrections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true; // Indicate success
    } catch (error) {
      console.error('删除批改记录失败:', error);
      throw error;
    }
  }

  // 通过 UUID 删除批改记录
  async deleteByUuid(uuid: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('corrections')
        .delete()
        .eq('uuid', uuid);

      if (error) throw error;
      return true; // Indicate success
    } catch (error) {
      console.error('删除批改记录失败:', error);
      throw error;
    }
  }

  // 更新批改进度状态
  /**
   * 根据 uuid 更新批改记录的状态
   * @param uuid 批改记录的 uuid
   * @param status 新的状态字符串（如 'pending', 'processing', 'success', 'failed' 等）
   * @returns 更新后的批改记录或 null
   */
  async updateStatusByUuid(uuid: string, status: string): Promise<Correction | null> {
    try {
      const { data, error } = await this.supabase
        .from('corrections')
        .update({ status })
        .eq('uuid', uuid)
        .select()
        .single();

      if (error) {
         if ((error as any).code === 'PGRST116') return null;
         throw error;
      }
      return data as Correction | null; // Cast to expected type
    } catch (error) {
      console.error('更新批改状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定用户的批改记录摘要 (只返回 title 和 uuid)，可选择限制返回数量
   * This function is optimized for fetching history list quickly by only returning title and uuid.
   * @param userEmail 用户邮箱
   * @param limit 返回数量上限
   * @param skip 跳过的记录数 (用于分页)
   * @returns 批改记录摘要数组 (只包含 title 和 uuid) 或 null
   */
  async getHistorySummaryByUserEmail(userEmail: string, limit?: number, skip?: number): Promise<Array<{ title: string; uuid: string }> | null> {
    try {
      let query = this.supabase
        .from('corrections')
        // 核心改变：只选择 title 和 uuid 字段
        .select('title, uuid, icon')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false }); // 保持按创建时间倒序

      // 分页逻辑与 getByUserEmail 保持一致
      if (skip !== undefined) {
        // Supabase range is inclusive [from, to]
        query = query.range(skip, skip + (limit || 100) - 1);
      } else if (limit !== undefined) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      // 返回的数据结构会是 { title: string, uuid: string }[]
      return data as Array<{ title: string; uuid: string }> | null;
    } catch (error) {
      console.error('获取批改记录摘要失败:', error);
      throw error;
    }
  }
}
