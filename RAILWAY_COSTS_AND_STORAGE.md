# Railway Costs & Data Storage Guide

## 💰 Monthly Costs on Railway

### Railway Pricing Plans (2024)

**Free Plan: $0/month**
- $1 free credit included
- Good for: Testing, development, very low traffic
- ⚠️ **Not recommended for production** (limited resources)

**Hobby Plan: $5/month** ⭐ **RECOMMENDED TO START**
- $5 usage credit included
- Perfect for: Starting out, small to medium traffic
- Usually covers: Small apps with moderate usage

**Pro Plan: $20/month**
- $20 usage credit included
- Perfect for: Growing business, higher traffic
- Better for: Production apps with real users

**Enterprise Plan: Custom pricing**
- For: Large scale deployments
- Contact Railway for pricing

---

### Usage-Based Costs (Beyond Plan Credits)

Railway charges for actual resource usage:

| Resource | Cost |
|----------|------|
| **RAM** | $10 per GB per month |
| **CPU** | $20 per vCPU per month |
| **Network Egress** | $0.10 per GB |
| **PostgreSQL Storage** | Included (up to 5GB on Hobby) |
| **Volume Storage** (optional) | $0.25 per GB per month |

---

### Estimated Monthly Costs for Exprora

#### **Scenario 1: Starting Out (0-10 clients, low traffic)**
- **Plan:** Hobby ($5/month)
- **Backend:** ~0.5 GB RAM, 0.25 vCPU = ~$7.50
- **Frontend:** ~0.5 GB RAM, 0.25 vCPU = ~$7.50
- **Database:** Included (PostgreSQL)
- **Network:** ~1 GB = $0.10
- **Total Usage:** ~$15.10
- **Plan Credit:** -$5.00
- **Your Cost:** **~$10-15/month** 💰

#### **Scenario 2: Growing (10-50 clients, medium traffic)**
- **Plan:** Pro ($20/month)
- **Backend:** ~1 GB RAM, 0.5 vCPU = ~$15
- **Frontend:** ~1 GB RAM, 0.5 vCPU = ~$15
- **Database:** Included (PostgreSQL)
- **Network:** ~10 GB = $1.00
- **Total Usage:** ~$31
- **Plan Credit:** -$20.00
- **Your Cost:** **~$31/month** 💰

#### **Scenario 3: Scaling (50+ clients, high traffic)**
- **Plan:** Pro ($20/month) or Enterprise
- **Backend:** ~2 GB RAM, 1 vCPU = ~$40
- **Frontend:** ~2 GB RAM, 1 vCPU = ~$40
- **Database:** May need larger instance
- **Network:** ~50 GB = $5.00
- **Total Usage:** ~$85+
- **Plan Credit:** -$20.00
- **Your Cost:** **~$65-100/month** 💰

---

### 💡 Cost Optimization Tips

1. **Start with Hobby Plan** ($5/month)
   - Monitor usage for first month
   - Upgrade only if needed

2. **Optimize Resource Usage**
   - Set memory limits in Railway
   - Use efficient database queries
   - Cache frequently accessed data

3. **Monitor Usage**
   - Railway dashboard shows real-time usage
   - Set up usage alerts
   - Review monthly invoices

4. **Database Storage**
   - PostgreSQL on Railway includes storage
   - Hobby: ~5GB included
   - Pro: More storage included
   - Archive old data if needed

---

## 📦 Where Customer Data is Stored

### All Data Stored in PostgreSQL Database on Railway

**Location:** Railway's PostgreSQL service (hosted on Railway infrastructure)

**Data Centers:** Railway uses cloud providers (Google, Microsoft, Amazon)
- Data may be stored in US or other regions
- Railway complies with data protection regulations

---

### Complete Data Storage Breakdown

#### **1. Client Account Data**
**Table:** `accounts`
- Company name, email, password (hashed)
- API keys
- Subscription plans and status
- Stripe customer IDs
- **Storage:** ~1-2 KB per client

#### **2. Experiments Data**
**Table:** `experiments`
- Experiment names, descriptions
- Test types, status, traffic allocation
- Goals and targeting rules
- **Storage:** ~2-5 KB per experiment

#### **3. Variants Data**
**Table:** `variants`
- Variant names, traffic percentages
- Visual editor changes (JSONB)
- CSS code, JavaScript code
- **Storage:** ~5-50 KB per variant (depends on code size)

#### **4. Visitor Data**
**Table:** `visitors`
- Visitor IDs, session IDs
- IP addresses, user agents
- First/last seen timestamps
- **Storage:** ~500 bytes per unique visitor

#### **5. Experiment Assignments**
**Table:** `experiment_assignments`
- Which variant each visitor sees
- Assignment timestamps
- **Storage:** ~200 bytes per assignment

#### **6. Events/Conversions**
**Table:** `events`
- Pageviews, clicks, conversions
- Event names, values, metadata
- **Storage:** ~500 bytes - 2 KB per event
- ⚠️ **This grows quickly with traffic!**

#### **7. Heatmap Data**
**Table:** `heatmap_data`
- Click coordinates (x, y)
- Scroll depth
- Element selectors
- Click counts
- **Storage:** ~200 bytes per heatmap data point
- ⚠️ **Can grow large with many clicks!**

#### **8. Session Recordings**
**Table:** `session_recordings`
- DOM snapshots
- User interaction events
- Recording data (JSONB)
- **Storage:** ~10-100 KB per recording
- ⚠️ **This is the largest data type!**

#### **9. Analytics Aggregated Data**
**Table:** `analytics_daily`
- Daily aggregated stats
- Visitors, conversions, revenue
- **Storage:** ~500 bytes per day per variant

#### **10. Billing Data**
**Tables:** `invoices`, `payments`
- Invoice records
- Payment history
- **Storage:** ~1-2 KB per invoice

---

### 📊 Storage Growth Estimates

#### **Small Client (1,000 visitors/month)**
- Events: ~5,000 events/month = ~2.5 MB
- Heatmaps: ~1,000 clicks/month = ~200 KB
- Recordings: 10 recordings/month = ~1 MB
- **Total per client:** ~4 MB/month

#### **Medium Client (10,000 visitors/month)**
- Events: ~50,000 events/month = ~25 MB
- Heatmaps: ~10,000 clicks/month = ~2 MB
- Recordings: 100 recordings/month = ~10 MB
- **Total per client:** ~37 MB/month

#### **Large Client (100,000 visitors/month)**
- Events: ~500,000 events/month = ~250 MB
- Heatmaps: ~100,000 clicks/month = ~20 MB
- Recordings: 1,000 recordings/month = ~100 MB
- **Total per client:** ~370 MB/month

---

### 💾 Database Storage Management

#### **Included Storage:**
- **Hobby Plan:** ~5 GB PostgreSQL storage
- **Pro Plan:** More storage (check Railway docs)
- **Enterprise:** Custom storage limits

#### **Storage Optimization Strategies:**

1. **Archive Old Data**
   ```sql
   -- Move old events to archive table
   -- Keep only last 90 days in main table
   ```

2. **Aggregate Data**
   - Use `analytics_daily` table for reports
   - Delete raw events older than 30 days
   - Keep only aggregated data

3. **Limit Recordings**
   - Only record sessions for active experiments
   - Auto-delete recordings older than 30 days
   - Limit number of recordings per client

4. **Clean Heatmap Data**
   - Aggregate heatmap data by day
   - Delete raw heatmap data older than 60 days
   - Keep only aggregated click maps

5. **Database Maintenance**
   - Regular VACUUM operations
   - Index optimization
   - Query optimization

---

### 🔒 Data Security & Compliance

**Where Data Lives:**
- Railway PostgreSQL database
- Railway infrastructure (cloud providers)
- Backend application (temporary, in-memory)
- Frontend (no sensitive data stored)

**Security Measures:**
- ✅ Passwords are hashed (bcrypt)
- ✅ API keys are encrypted
- ✅ Database connections use SSL
- ✅ JWT tokens for authentication
- ✅ Input validation on all endpoints
- ✅ SQL injection protection

**Compliance:**
- Railway complies with data protection regulations
- EU-US Data Privacy Framework compliant
- You may need additional compliance (GDPR, CCPA) based on your clients

---

### 📈 Scaling Recommendations

#### **When to Upgrade:**

**Upgrade to Pro Plan when:**
- Monthly usage exceeds $20
- You have 20+ active clients
- Database storage approaching 5GB
- Need better performance

**Consider Enterprise when:**
- 100+ clients
- High traffic (millions of events/month)
- Need dedicated support
- Custom compliance requirements

---

### 💰 Revenue vs Costs

**Your Pricing:**
- Starter: $49/month
- Professional: $149/month
- Enterprise: $499/month

**Break-even Analysis:**
- **1 Starter client** = $49/month → Covers Railway costs easily ✅
- **1 Professional client** = $149/month → Very profitable ✅
- **10 Starter clients** = $490/month → Railway cost ~$30 → **$460 profit** 💰

---

### 📝 Summary

**Starting Costs:**
- Railway Hobby Plan: **$5/month**
- Expected usage: **$10-15/month**
- **Total: ~$15/month** to start

**Data Storage:**
- All data in PostgreSQL on Railway
- Included storage: ~5GB (Hobby plan)
- Each client uses ~4-370 MB/month depending on traffic

**Break-even:**
- Just **1 paying client** covers all costs
- Very profitable at scale! 🚀

---

### 🎯 Action Items

1. **Start with Hobby Plan** ($5/month)
2. **Monitor usage** for first month
3. **Set up data retention policies** (archive old data)
4. **Upgrade to Pro** when you have 10+ clients
5. **Implement data aggregation** to reduce storage

---

**Bottom Line:** Railway is very affordable to start, and you'll be profitable with just 1 paying client! 🎉

